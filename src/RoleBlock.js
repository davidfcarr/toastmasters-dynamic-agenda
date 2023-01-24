import React, {useState, useEffect} from "react"
import { __experimentalNumberControl as NumberControl, SelectControl, ToggleControl, TextControl } from '@wordpress/components';
//import {RichText} from '@wordpress/components'
import EditorMCE from './EditorMCE.js'
import ProjectChooser from "./ProjectChooser.js";
import Suggest from "./Suggest.js";
import MoveAssignment from "./MoveAssignment.js";

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
            updateAssignment(newassignments,blockindex,start);
        scrolltoId(roletagbase+newindex);
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
            updateAssignment(newassignments,blockindex,start);
    }

    function getMemberName(id) {
        console.log('get member name, memberlist',memberlist);
        let m = memberlist.find( (item) => {console.log('member item',item); if(item.value == id) return item; } );
        console.log('member return ',m);
        return m?.value;
    }

    if(['reorganize'].includes(mode))
        return (<h3>{attrs.role} ({attrs.count})</h3>);    

    let count = (attrs.count) ? attrs.count : 1;
    let openslots = [];
    let filledslots = [];
    let role = attrs.role;
    let role_label = attrs.role;
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
                <h3>{role_label} {shownumber} {assignment.name} {assignment.ID > 0 && (('edit' == mode) || (current_user_id == assignment.ID)) && <button className="tmform" onClick={function(event) {/*event.target.disabled = true;*/ console.log('click blockindex '+blockindex+' roleindex '+roleindex); updateAssignment({'ID':0,'name':'','role': role,'blockindex':blockindex,'roleindex':roleindex,'start':start})}} >Reset</button>}</h3>
                <>{(assignment.ID < 1) && <p><button className="tmform" onClick={function(event) {/*event.target.disabled = true;*/ updateAssignment({'ID':current_user_id,'name':current_user_name,'role': role,'roleindex':roleindex,'blockindex':blockindex,'start':start}) } }>Take Role</button></p>}</>
            <>{('suggest' == mode) && !assignment.ID && <Suggest memberlist={memberlist} roletag={roletagbase+(roleindex+1)} post_id={props.post_id} current_user_id={current_user_id} />}</>
            <>{('edit' == mode) && <SelectControl label="Select Member" value={assignment.ID} options={memberlist} onChange={(id) => { updateAssignment({'ID':id,'name':getMemberName(id),'role': role,'roleindex': roleindex,'blockindex':blockindex,'start':start})}} />}</>
            <>{(('edit' == mode) || (current_user_id == assignment.ID)) && (assignment.ID > 0) && (!['reorganize','reorganize'].includes(mode)) && (role.search('Speaker') > -1)  && (role.search('Backup') == -1) && <ProjectChooser attrs={attrs} assignment={assignment} project={assignment.project} manual={assignment.manual} maxtime={assignment.maxtime} display_time={assignment.display_time} updateAssignment={updateAssignment} roleindex={roleindex} blockindex={blockindex} /> }</>

            <p>{('edit' == mode) && (assignments.length > 1) && (roleindex > 0) && <><button  className="tmform" onClick={() => {moveItem(roleindex,0)}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up-circle" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/></svg> Move {attrs.role} {shownumber} to Top</button> <button  className="tmform" onClick={() => {moveItem(roleindex, roleindex-1)}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up-circle" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/></svg> Move {attrs.role} {shownumber} Up</button></>} {('edit' == mode) && (assignments.length > 1) && (roleindex < (assignments.length - 1)) && (attrs.role.search('Backup') < 0) && <button className="tmform" onClick={() => {moveItem(roleindex, roleindex+1)}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-circle" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V4.5z"/>
</svg> Move {attrs.role} {shownumber} Down</button>} </p>

            </div>)
        } )}
        <div>{'edit' == mode && filledslots.length && openslots.length && (filledslots[filledslots.length-1] > openslots[0]) && <p><button className="tmform" onClick={removeBlanks}>Close Gaps</button></p>}</div>
        </>
    );

}