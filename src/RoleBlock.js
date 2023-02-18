import React, {useState, useEffect} from "react"
import { __experimentalNumberControl as NumberControl, SelectControl, ToggleControl, TextControl } from '@wordpress/components';
//import {RichText} from '@wordpress/components'
import EditorMCE from './EditorMCE.js'
import ProjectChooser from "./ProjectChooser.js";
import Suggest from "./Suggest.js";
import {Up, Down, Top, Close} from './icons.js';

export default function RoleBlock (props) {
    const {agendadata, mode, showDetails, blockindex, updateAssignment, setMode, setScrollTo, block} = props;
    console.log('role block props',props);
    console.log('role block',block);
    const { assignments, attrs, memberoptions} = block;
    
    console.log('role block memberoptions',memberoptions);
    const {current_user_id, current_user_name} = agendadata;
    const [guests,setGuests] = useState([].fill('',0,attrs.count));

    if(!attrs.role)
        return null;
    let roletagbase = '_'+attrs.role.replaceAll(/[^A-Za-z]/g,'_')+'_';
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
                if((prevassignment.ID != 0) && (prevassignment.ID != "0")) {
                    newassignments.push(prevassignment);
                    console.log('remove blanks adding',prevassignment);
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
        console.log('get member name, memberoptions',memberoptions);
        let m = memberoptions.find( (item) => {console.log('member item',item); if(item.value == id) return item; } );
        console.log('member return ',m);
        return m?.value;
    }

    function MoveButtons(props) {
    const {assignments, roleindex, filledslots, openslots, attrs, shownumber} = props;
    let showclose = false;
    //console.log(attrs.role+' movebuttons filledslots ',filledslots);
    //console.log(attrs.role+' movebuttons filledslots ',openslots);
    if(filledslots.length > 0 && openslots.length > 0)
        {
            if(filledslots[filledslots.length-1] > openslots[0])
                {
                    showclose = true;
                    console.log(attrs.role+' movebuttons closebutton yes lastfilled',filledslots[filledslots.length-1]);
                    console.log(attrs.role+' movebuttons closebutton yes firstopen',openslots[0]);
                }
                else
                {
                    console.log('movebuttons closebutton NO lastfilled',filledslots[filledslots.length-1]);
                    console.log('movebuttons closebutton NO firstopen',openslots[0]);
                }

        }
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
    <span className="closegaps">{showclose && <button className="tmform" onClick={removeBlanks}><Close /></button>}</span>
    </p>
    )        

    }

    if(['reorganize'].includes(mode) && Array.isArray(assignments))
        return (
        <>
        {assignments.map( (assignment, roleindex) => {
            if((assignment.ID != 0) && (assignment.ID != "0"))
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
                <h3>{role_label} {shownumber} {assignment.name} {assignment.ID > 0 && (('edit' == mode) || (current_user_id == assignment.ID)) && ('reorganize' != mode) && <button className="tmform" onClick={function(event) {/*event.target.disabled = true;*/ console.log('click blockindex '+blockindex+' roleindex '+roleindex); if('Speaker' == role) updateAssignment({'ID':0,'name':'','role': role,'blockindex':blockindex,'roleindex':roleindex,'start':start,'count':count,'manual':'','title':'','project':'','intro':'','maxtime':7,'display_time':'5 - 7 minutes'}); else updateAssignment({'ID':0,'name':'','role': role,'blockindex':blockindex,'roleindex':roleindex,'start':start,'count':count})}} >Remove</button>}</h3>
            <MoveButtons assignments={assignments} roleindex={roleindex} filledslots={filledslots} openslots={openslots} attrs={attrs} shownumber={shownumber} />
            </div>)
        } )}
        </>
        );    

    if(!Array.isArray(assignments))
        assignments = [{'ID':0}];

    return (
        <>
        {assignments.map( (assignment, roleindex) => {
            if(("0" == assignment.ID) || (0 == assignment.ID))
                openslots.push(roleindex);
            else
                filledslots.push(roleindex);
            let shownumber = ((attrs.count && (attrs.count > 1)) || (start > 1)) ? '#'+(roleindex+start) : '';
            if(roleindex == count) {
                role_label = 'Backup '+role;
                shownumber = '';
            }
            else if (roleindex > count) {
                //only show one backup assignment
                return null;
            }
            let id = 'role'+attrs.role.replaceAll(/[^A-z]/g,'')+roleindex;
            if('suggest' == mode && assignment.ID)
                console.log('suggest assignment ID for '+role_label,assignment.ID);
            return (<div id={id} key={id}>
            {assignment.ID > 0 && 'Speaker' == attrs.role && <p><a className="evaluation-link" href={assignment.evaluation_link} target="_blank">Evaluation Form</a></p>}
                <h3>{role_label} {shownumber} {assignment.name} {assignment.ID > 0 && (('edit' == mode) || (current_user_id == assignment.ID)) && <button className="tmform" onClick={function(event) { console.log('click blockindex '+blockindex+' roleindex '+roleindex); let a = ('Speaker' == role) ? {'ID':0,'name':'','role': role,'blockindex':blockindex,'roleindex':roleindex,'start':start,'count':count,'intro':'','title':'','manual':'','project':'','maxtime':7,'display_time':'5 - 7 minutes'} : {'ID':0,'name':'','role': role,'blockindex':blockindex,'roleindex':roleindex,'start':start,'count':count}; updateAssignment(a)}} >Remove</button>} {}</h3>
                <>{assignment.ID == 0 && ('signup' == mode) && <p><button className="tmform" onClick={function(event) {if('Speaker' == role) updateAssignment({'ID':current_user_id,'name':current_user_name,'role': role,'roleindex':roleindex,'blockindex':blockindex,'start':start,'count':count,'maxtime':7,'display_time':'5 - 7 minutes'}); updateAssignment({'ID':current_user_id,'name':current_user_name,'role': role,'roleindex':roleindex,'blockindex':blockindex,'start':start,'count':count}) } }>Take Role</button></p>}</>
            <>{'suggest' == mode && (assignment.ID == 0) && <Suggest memberoptions={memberoptions} roletag={roletagbase+(roleindex+1)} post_id={props.post_id} current_user_id={current_user_id} />}</>
            <>{'edit' == mode && <SelectControl label="Select Member" value={assignment.ID} options={memberoptions} onChange={(id) => { if('Speaker' == role) updateAssignment({'ID':id,'name':getMemberName(id),'role': role,'roleindex': roleindex,'blockindex':blockindex,'start':start,'count':count,'manual':'','title':'','project':'','intro':'','maxtime':7,'display_time':'5 - 7 minutes'}); else updateAssignment({'ID':id,'name':getMemberName(id),'role': role,'roleindex': roleindex,'blockindex':blockindex,'start':start,'count':count})}} />}</>
            <>{'edit' == mode && assignment.ID == 0 && <div className="tmflexrow"><div className="tmflex30"><TextControl label="Or Add Guest" value={guests[roleindex]} onChange={ (id) => { let newguests = [...guests]; newguests[roleindex] = id; setGuests(newguests); } } /></div><div className="tmflex30"><br /><button className="tmform" onClick={() => { updateAssignment({'ID':guests[roleindex],'name':guests[roleindex] + ' (guest)','role': role,'roleindex': roleindex,'blockindex':blockindex,'start':start,'count':count}); let newguests = [...guests]; newguests[roleindex] = ''; setGuests(newguests);} } >Add</button></div></div>}</>
            <>{'suggest' != mode && ('edit' == mode || (current_user_id == assignment.ID)) && (assignment.ID > 0) && (!['reorganize','reorganize'].includes(mode)) && (role.search('Speaker') > -1)  && (role.search('Backup') == -1) && showDetails && <ProjectChooser attrs={attrs} assignment={assignment} project={assignment.project} title={assignment.title} intro={assignment.intro} manual={assignment.manual} maxtime={assignment.maxtime} display_time={assignment.display_time} updateAssignment={updateAssignment} roleindex={roleindex} blockindex={blockindex} /> }</>

            <>{!!('edit' == mode) && assignments.length > 1 && <MoveButtons assignments={assignments} roleindex={roleindex} filledslots={filledslots} openslots={openslots} attrs={attrs} shownumber={shownumber} />}</>
            {('signup' == mode) && <p><button className="tmsmallbutton" onClick={() => {setScrollTo(id);setMode('edit')}}>Edit</button> {assignment.ID == 0 && <button className="tmsmallbutton" onClick={() => {setScrollTo(id);setMode('suggest')}}>Suggest</button>}</p>}
            {'Evaluator' == attrs.role && console.log('evaluator filled '+mode,filledslots)}
            {'Evaluator' == attrs.role && console.log('evaluator open '+mode,openslots)}

            </div>)
        } )}
        </>
    );

}