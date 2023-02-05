import React, {useState, useEffect} from "react"
import { __experimentalNumberControl as NumberControl, SelectControl, ToggleControl, TextControl } from '@wordpress/components';
//import {RichText} from '@wordpress/components'
import EditorMCE from './EditorMCE.js'
import ProjectChooser from "./ProjectChooser.js";
import Suggest from "./Suggest.js";
import {Up, Down, Top, Close} from './icons.js';

export default function RoleBlock (props) {
    const {agendadata, mode, blockindex, assignments, attrs, updateAssignment, updateAttrs, post_id} = props;
    const {current_user_id, current_user_name} = agendadata;
    const [memberlist,setMemberList] = useState([{'value':0,'label':'Loading ...'}]);
    let roletagbase = '_'+attrs.role.replaceAll(' ','_')+'_';
    const [viewTop,setViewTop] = useState('');
    let roles = [];
    var start = (attrs.start) ? parseInt(attrs.start) : 1;
    if(!start)
        start = 1;
    let count = (attrs.count) ? attrs.count : 1;
    let openslots = [];
    let filledslots = [];
    let role = attrs.role;
    let role_label = attrs.role;
    
    useEffect( () => {
        getMemberList();
    },[post_id]);

    function getMemberList () {
        fetch(wpt_rest.url + 'rsvptm/v1/members_for_role/'+roletagbase+'/'+post_id, {headers: {'X-WP-Nonce': wpt_rest.nonce}})
        .then((response) => response.json())
        .then((data) => {
            console.log('data for '+roletagbase, data);
            setMemberList(data);
        });
        console.log('fetched memberlist', memberlist);
    }

    function scrolltoId(id){
        if(!id)
            return;
        var access = document.getElementById(id);
        if(!access)
            {
                console.log('scroll to id could not find element');
                return;
            }
        access.scrollIntoView({behavior: 'smooth'}, true);
    }
    
    function moveItem(roleindex, newindex) {
            let myassignment = assignments[roleindex];
            myassignment.role = attrs.role;
            let newassignments = [];
            assignments.forEach((prevassignment,previndex) => {
                prevassignment.role = attrs.role;
                if((previndex == newindex) && (newindex < roleindex)) {
                    newassignments.push(myassignment); //insert before
                    newassignments.push(prevassignment);
                }
                else if((previndex == newindex) && (newindex > roleindex)) {
                    newassignments.push(prevassignment);
                    newassignments.push(myassignment); //insert after
                }
                else if(previndex != roleindex) // skip spot my assignment previously occupied
                   newassignments.push(prevassignment);
            });
            updateAssignment(newassignments,blockindex,start,count);
        scrolltoId('block'+blockindex);
    }

    function removeBlanks() {
        console.log('remove blanks, current assignments',assignments);
            let newassignments = [];
            let removed = [];
            assignments.forEach((prevassignment,previndex) => {
                prevassignment.role = attrs.role;
                if(prevassignment.ID) {
                    newassignments.push(prevassignment);
                    console.log('adding',prevassignment);
                }
                else {
                    removed.push(prevassignment);
                }
            });
            removed.forEach( (r) => {newassignments.push(r); console.log('addinng to bottom',r);} );
            console.log('remove blanks new assignments',newassignments);
            updateAssignment(newassignments,blockindex,start,count);
    }

    function getMemberName(id) {
        console.log('get member name, memberlist',memberlist);
        let m = memberlist.find( (item) => {console.log('member item',item); if(item.value == id) return item; } );
        console.log('member return ',m);
        return m?.value;
    }

    function MoveButtons(props) {
    const {assignments, roleindex, filledslots, openslots, attrs, shownumber} = props;
    return(
    <p><span className="moveup">{assignments.length > 1 && roleindex > 0 && <>
    <button  className="tmform" onClick={() => {moveItem(roleindex,0)}}>
    <Top type={attrs.role+' '+shownumber}/></button>
    <button  className="tmform" onClick={() => {moveItem(roleindex, roleindex-1)}}>
    <Up type={attrs.role+' '+shownumber} /></button>
    </>}</span> 
    <span className="movedown">{assignments.length > 1 && roleindex < (assignments.length - 1) && attrs.role.search('Backup') < 0 && 
    <button className="tmform" onClick={() => {moveItem(roleindex, roleindex+1)}}>
    <Down type={attrs.role+' '+shownumber} />
    </button>}</span>
    <span className="closegaps">{filledslots.length > 0 && openslots.length > 0 && (filledslots[filledslots.length-1] > openslots[0]) && <button className="tmform" onClick={removeBlanks}><Close /></button>}</span>
    </p>
    )        


    }

    if(['reorganize'].includes(mode))
        return (
        <>
        {assignments.map( (assignment, roleindex) => {
            if(assignment.ID)
                filledslots.push(roleindex);
            else
                openslots.push(roleindex);
            let shownumber = ((attrs.count && (attrs.count > 1)) || (start > 1)) ? '#'+(roleindex+start) : '';
            if(roleindex == count) {
                role_label = 'Backup '+role;
                shownumber = '';
            }
            else if (roleindex > count) {
                //only show one backup assignment
                return null;
            }
            let id = 'role'+attrs.role.replace(' ','')+roleindex;
            return (<div id={id} key={id}>
                <h3>{role_label} {shownumber} {assignment.name} {assignment.ID > 0 && (('edit' == mode) || (current_user_id == assignment.ID)) && <button className="tmform" onClick={function(event) {/*event.target.disabled = true;*/ console.log('click blockindex '+blockindex+' roleindex '+roleindex); updateAssignment({'ID':0,'name':'','role': role,'blockindex':blockindex,'roleindex':roleindex,'start':start,'count':count})}} >Remove</button>}</h3>
            <MoveButtons assignments={assignments} roleindex={roleindex} filledslots={filledslots} openslots={openslots} attrs={attrs} shownumber={shownumber} />
            </div>)
        } )}
        </>
        );    

    return (
        <>
        {assignments.map( (assignment, roleindex) => {
            if(assignment.ID)
                filledslots.push(roleindex);
            else
                openslots.push(roleindex);
            let shownumber = ((attrs.count && (attrs.count > 1)) || (start > 1)) ? '#'+(roleindex+start) : '';
            if(roleindex == count) {
                role_label = 'Backup '+role;
                shownumber = '';
            }
            else if (roleindex > count) {
                //only show one backup assignment
                return null;
            }
            let id = 'role'+attrs.role+roleindex;
            return (<div id={id} key={id}>
                <h3>{role_label} {shownumber} {assignment.name} {assignment.ID > 0 && (('edit' == mode) || (current_user_id == assignment.ID)) && <button className="tmform" onClick={function(event) {/*event.target.disabled = true;*/ console.log('click blockindex '+blockindex+' roleindex '+roleindex); updateAssignment({'ID':0,'name':'','role': role,'blockindex':blockindex,'roleindex':roleindex,'start':start,'count':count})}} >Remove</button>}</h3>
                <>{assignment.ID < 1 && <p><button className="tmform" onClick={function(event) {/*event.target.disabled = true;*/ updateAssignment({'ID':current_user_id,'name':current_user_name,'role': role,'roleindex':roleindex,'blockindex':blockindex,'start':start,'count':count}) } }>Take Role</button></p>}</>
            <>{'suggest' == mode && !assignment.ID && <Suggest memberlist={memberlist} roletag={roletagbase+(roleindex+1)} post_id={props.post_id} current_user_id={current_user_id} />}</>
            <>{'edit' == mode && <SelectControl label="Select Member" value={assignment.ID} options={memberlist} onChange={(id) => { updateAssignment({'ID':id,'name':getMemberName(id),'role': role,'roleindex': roleindex,'blockindex':blockindex,'start':start,'count':count})}} />}</>
            <>{'suggest' != mode && ('edit' == mode || (current_user_id == assignment.ID)) && (assignment.ID > 0) && (!['reorganize','reorganize'].includes(mode)) && (role.search('Speaker') > -1)  && (role.search('Backup') == -1) && <ProjectChooser attrs={attrs} assignment={assignment} project={assignment.project} title={assignment.title} intro={assignment.intro} manual={assignment.manual} maxtime={assignment.maxtime} display_time={assignment.display_time} updateAssignment={updateAssignment} roleindex={roleindex} blockindex={blockindex} /> }</>

            <>{!!('edit' == mode) && assignments.length > 1 &&             <MoveButtons assignments={assignments} roleindex={roleindex} filledslots={filledslots} openslots={openslots} attrs={attrs} shownumber={shownumber} />}</>

            </div>)
        } )}
        </>
    );

}