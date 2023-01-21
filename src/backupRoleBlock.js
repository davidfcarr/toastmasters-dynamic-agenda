import React, {useState, useEffect} from "react"
import { __experimentalNumberControl as NumberControl, SelectControl, ToggleControl, TextControl } from '@wordpress/components';
//import {RichText} from '@wordpress/components'
import EditorMCE from './EditorMCE.js'
import ProjectChooser from "./ProjectChooser.js";
import Suggest from "./Suggest.js";
import MoveAssignment from "./MoveAssignment.js";

export default function RoleBlock (props) {
    const {agendadata, mode, blockindex, assignments, attrs, updateAssignment, updateAttrs} = props;
    const {current_user_id, current_user_name} = agendadata;
    const [memberlist,setMemberList] = useState([]);
    let roletagbase = '_'+attrs.role.replaceAll(' ','_')+'_';
    const [viewTop,setViewTop] = useState('');
    let roles = [];

    useEffect( () => {
        fetch(wpt_rest.url + 'rsvptm/v1/members_for_role/'+roletagbase+'/'+wpt_rest.post_id, {headers: {'X-WP-Nonce': wpt_rest.nonce}})
        .then((response) => response.json())
        .then((data) => {
            setMemberList(data);
        });
    },[]);

    function scrolltoId(id){
        if(!id)
            return;
        var access = document.getElementById(id);
        if(!access)
            {
                console.log('scroll to id could not find element');
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
            updateAssignment(newassignments,blockindex);
        scrolltoId(roletagbase+newindex);
    }

    let count = (attrs.count) ? attrs.count : 1;
    assignments.length = count; // ignore any extra assignments
    return (
        <>        
        {assignments.map( (assignment, roleindex) => {
            let id = 'role'+attrs.role+roleindex;
            let shownumber = (attrs.count && (attrs.count > 1)) ? '#'+(roleindex+1) : '';
            return (<div id={id} key={id}>
                <h3>{attrs.role} {shownumber} {assignment.name} {assignment.ID > 0 && (('edit' == mode) || (current_user_id == assignment.ID)) && <button className="tmform" onClick={() => {updateAssignment({'ID':0,'name':'','role': attrs.role,'roleindex':roleindex,'blockindex':blockindex})}} >Reset</button>}</h3>
            {(assignment.ID < 1) && <p><button className="tmform" onClick={() => {updateAssignment({'ID':current_user_id,'name':current_user_name,'role': attrs.role,'roleindex':roleindex,'blockindex':blockindex}) } }>Take Role</button></p>}
            {('suggest' == mode) && !assignment.ID && <Suggest memberlist={memberlist} roletag={roletagbase+(roleindex+1)} post_id={props.post_id} current_user_id={current_user_id} />}
            {('edit' == mode) && <SelectControl label="Select Member" value={assignment.ID} options={memberlist} onChange={(id) => { updateAssignment({'ID':id,'name':'Member ID: '+id,'role': attrs.role,'roleindex': roleindex,'blockindex':blockindex})}} />}
            {(('edit' == mode) || (current_user_id == assignment.ID)) && ('reorganize' != mode) && (attrs.role.search('Speaker') > -1) && <ProjectChooser assignment={assignment} project={assignment.project} manual={assignment.manual} maxtime={assignment.maxtime} display_time={assignment.display_time} updateAssignment={updateAssignment} roleindex={roleindex} blockindex={blockindex} /> }

            <p>{('reorganize' == mode) && (assignments.length > 1) && (roleindex > 0) && <><button  className="tmform" onClick={() => {moveItem(roleindex,0)}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up-circle" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/></svg> Move {attrs.role} {shownumber} to Top</button> <button  className="tmform" onClick={() => {moveItem(roleindex, roleindex-1)}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up-circle" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/></svg> Move {attrs.role} {shownumber} Up</button></>} {('reorganize' == mode) && (assignments.length > 1) && (roleindex < (assignments.length - 1)) && (attrs.role.search('Backup') < 0) && <button className="tmform" onClick={() => {moveItem(roleindex, roleindex+1)}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-circle" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V4.5z"/>
</svg> Move {attrs.role} {shownumber} Down</button>}</p>

            </div>)
        } )}
        </>
    );

    /*
                {('reorganize' == mode) && (attrs?.count > 1) && <MoveAssignment blockindex={blockindex} roleindex={roleindex} assignments={assignments} updateAssignment={updateAssignment} />}

    */



    useEffect( () => {
        scrolltoId(viewTop);
    },[viewTop]);

    useEffect( () => {
        updateAssignments();
    },[assignments]);

    function updateCount(newcount) {
        return;
        props.setAgenda( (prevagenda) => {
            //console.log(prevagenda.blocksdata[props.blockindex].attrs);
            //alert(prevagenda.blocksdata[props.blockindex].attrs.count);
            prevagenda.blocksdata[props.blockindex].attrs.count = newcount;
            let diff = newcount = prevagenda.blocksdata[props.blockindex].assignments.length;
            for(let i = 0; i < diff; i++)
                prevagenda.blocksdata[props.blockindex].assignments.push({'ID':0,'name':''});
            console.log(prevagenda);
            return prevagenda;
        });
        let url = wpt_rest.url + 'rsvptm/v1/update_role_count';
        let toUpdate = {'post_id':props.post_id,'role': props.role,'count': newcount}
        fetch(url, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            headers: {
              'X-WP-Nonce': wpt_rest.nonce,
            },
            body: JSON.stringify(toUpdate)
          })
        .then((response) => {return response.json()})
        .then((responsedata) => {
            if(responsedata.status) {
                console.log('updated count');
            }
        });

    }

    function updateSpeech(value,property,roleindex,thisblockindex) {
        setAssignments((prev) => {
            //console.log('previous');
            //console.log(prev);
            let newassignments = prev.map((prevassignment,previndex) => {
                //console.log('role index '+roleindex);
                //console.log('previous index '+previndex);
                if(previndex == roleindex)
                    prevassignment[property] = value;
                return prevassignment;
            })
            return newassignments;
        });
    }

    function moveToTop(roleindex) {
        setAssignments((prev) => {
            //console.log('previous');
            //console.log(prev);
            let newassignments = [prev[roleindex]];
            prev.forEach((prevassignment,previndex) => {
                if(previndex != roleindex)
                newassignments.push(prevassignment);
            });
            //console.log('new assignments after move');
            //console.log(newassignments);
            return newassignments;
        });
        //updateAssignments();
    }


    function removeBlanks() {
        let update = false;
        //console.log('removeblanks top');
        //console.log(assignments);
        setAssignments((prev) => {
            //console.log('previous');
            //console.log(prev);
            let newassignments = [];
            let removed = [];
            prev.forEach((prevassignment,previndex) => {
                if(prevassignment.ID) {
                    newassignments.push(prevassignment);
                    update = true;
                }
                else {
                    removed.push(prevassignment);
                }
            });
            removed.forEach( (r) => newassignments.push(r) );
            //console.log('new assignments after move');
            //console.log(newassignments);
            return newassignments;
        });
        //console.log('removeblanks bottom');
        //console.log(assignments);
        //if(update)
        //updateAssignments();
    }

    function updateAssignments() {

        let url = wpt_rest.url + 'rsvptm/v1/update_role';
        let ids = [];
        let titles = [];
        let intros = [];
        let toUpdate = {'post_id':props.post_id,'role': props.role,'assignments': assignments}
        fetch(url, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            headers: {
              'X-WP-Nonce': wpt_rest.nonce,
            },
            body: JSON.stringify(toUpdate)
          })
        .then((response) => {return response.json()})
        .then((responsedata) => {
            if(responsedata.status) {
                console.log('ran updateAssignments');
                console.log(responsedata.status);
                //props.setUpdated(Date.now());
                makeNotification('Updated');
            }
        });
    }

    let openslot = -1;

    //current user = tmvars.user_id
    let a;
    for(var i=1; i<=count; i++) {
        a = (typeof assignments[i-1] == 'undefined') ? {'ID': 0, 'name': ''} : assignments[i-1];
        roles.push({'role':props.role,'number': i, 'assigned': a});
        if(!a.ID)
            openslot = i - 1;
    }
    if(props.backup) {
        if(assignments[count].ID && openslot > -1) {
            roles[openslot] = {'role':props.role,'number': openslot+1, 'assigned': assignments[count]};
            roles.push({'role':'Backup '+props.role,'number': 1, 'assigned': [{'ID':0,'name':''}]});
        }
        else
            roles.push({'role':'Backup '+props.role,'number': 1, 'assigned': assignments[count]});
    }
    //console.log('previous for '+props.role);
    //console.log(props.prev);

    if(!current_user_id) {
        return (
            <>
            <p>{props.role} Count: {count}</p>
            {
                roles.map( (role, roleindex) => {
                        //console.log(role); 
                    if(typeof assignment === 'undefined')
                        {
                            //console.log('role assigned issue')
                            //console.log(role);
                            assignment = {'ID': 0, 'name': ''};
                        }
                        let showassigned = (assignment && assignment.ID) ? assignment.name : '';
                        let manual = assignment && assignment.manual ? assignment.manual : ''
                        return (<div><p><strong>{attrs.role}</strong> {role.number} {showassigned}</p>
                        {assignment.manual && <p><strong>Path</strong> {assignment.manual}</p>}
                        {assignment.project && <p><strong>Project</strong> {assignment.project}</p>}
                        {('Speaker' == attrs.role) && <p><strong>Title</strong> {(assignment.title) ? assignment.title : ''}</p>}
                        </div>)
        } )
    }
    </>
    )
}
    let blanks = false;
    let indexend = (props.backup) ? roles.length -1 : roles.length;

    return (
    <>
    {
        roles.map( (role, roleindex) => {
            if(typeof assignment === 'undefined')
                {
                    assignment = {'ID': 0, 'name': ''};
                }
            
            if(assignment.ID < 1)
                blanks = true;
            let showassigned = (assignment && assignment.ID) ? assignment.name : '';
            let manual = assignment && assignment.manual ? assignment.manual : 'Path Not Set Level 1 Mastering Fundamentals'
            let project = assignment && assignment.project ? assignment.project : '';
            return (<div className="rb" id={roletagbase+(roleindex+1)}><p><strong>{attrs.role}</strong> {(roles.length > 1) && role.number} {showassigned}</p>
            <div className="tmflexrow">
            {!('edit' == mode) && !suggest && !showassigned && <div><button  className="tmform" onClick={() => {roleBlockAssign(roletagbase+(roleindex+1),roleindex,current_user_id); setViewTop(roletagbase+(roleindex+1));}}>Take Role</button></div>}
                {(current_user_id != assignment.ID) && <div><ToggleControl label="Edit"
            help={
                ('edit' == mode)
                    ? 'Editing'
                    : 'Viewing'
            }
            checked={ ('edit' == mode) }
            onChange={ () => {
                setEditing( ( state ) => ! state );
                setSuggest(false);
                setViewTop(roletagbase+(roleindex+1));
            } } /></div>}
            
                {!assignment.ID && <div><ToggleControl label="Suggest"
            help={
                ('edit' == mode)
                    ? 'Suggesting'
                    : 'Viewing'
            }
            checked={ suggest }
            onChange={ () => {
                setSuggest( ( state ) => ! state );
                setEditing(false);
                setViewTop(roletagbase+(roleindex+1));
            } } /></div>}
            </div>
            {(!('edit' == mode) && (current_user_id != assignment.ID)) && assignment.manual && <p><strong>Path</strong> {assignment.manual}</p>}
            {(!('edit' == mode) && (current_user_id != assignment.ID)) && (!('edit' == mode) && (current_user_id != assignment.ID)) && assignment.project && <p><strong>Project</strong> {assignment.project}</p>}
            {(!('edit' == mode) && (current_user_id != assignment.ID)) && ('Speaker' == attrs.role) && assignment.title && <p><strong>Title</strong> {(assignment.title) ? assignment.title : ''}</p>}
            {(!('edit' == mode) && (current_user_id != assignment.ID)) && ('Speaker' == attrs.role) && assignment.intro && <div><p><strong>Intro</strong></p><div dangerouslySetInnerHTML= {{__html:(assignment.intro) ? assignment.intro : ''}} /></div>}
            {(!('edit' == mode) && (current_user_id != assignment.ID)) && (attrs.role.search('Speaker') > -1) && assignment.display_time && <p><strong>Timing</strong> {(assignment.display_time) ? assignment.display_time : ''}</p>}
            {suggest && !assignment.ID && <Suggest memberlist={memberlist} roletag={roletagbase+(roleindex+1)} post_id={props.post_id} current_user_id={current_user_id}  />}
            {assignment.ID > 0 && (('edit' == mode) || (current_user_id == assignment.ID)) && <button  className="tmform" onClick={() => {roleBlockAssign(roletagbase+(roleindex+1),roleindex,0); setEditing(true);setViewTop(roletagbase+(roleindex+1));}}>Reset</button>}
            {(('edit' == mode) && (current_user_id != assignment.ID)) && <SelectControl label="Select Member" value={assignment.ID} options={memberlist} onChange={(id) => { roleBlockAssign(roletagbase+role.number,roleindex,id); }} />}
            {(('edit' == mode) || (current_user_id == assignment.ID)) && (attrs.role.search('Speaker') > -1) && <ProjectChooser assigned={assignment} project={project} manual={manual} maxtime={assignment.maxtime} display_time={assignment.display_time} onChangeFunction={updateSpeech} index={roleindex} /> }
            {(('edit' == mode) || (current_user_id == assignment.ID)) && (attrs.role.search('Speaker') > -1) && (('edit' == mode) || assignment.ID == current_user_id) && <p><strong>Title</strong> <TextControl value={(assignment.title) ? assignment.title : ''} onChange={(value) => {updateSpeech(value,'title',roleindex)}} /></p>}
            {(('edit' == mode) || (current_user_id == assignment.ID)) && (attrs.role.search('Speaker') > -1) && (('edit' == mode) || assignment.ID == current_user_id) && <p><strong>Intro</strong> <EditorMCE value={(assignment.intro) ? assignment.intro : ''} updateSpeech={updateSpeech} updateAssignments={updateAssignments} param="intro" index={roleindex} /> </p>}
            
            {/*('Speaker' != props.role) && (('edit' == mode) || (assignment.ID == current_user_id)) && <button  className="tmform" onClick={updateAssignments}>Update</button>*/}
            
            <p>{(role.number > 1) && <><button  className="tmform" onClick={() => {moveToTop(roleindex)}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up-circle" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/></svg> Move to Top</button> <button  className="tmform" onClick={() => {moveItem(roleindex, roleindex-1)}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up-circle" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/></svg> Move Up</button></>} {(roles.length > 1) && (role.number < indexend) && (attrs.role.search('Backup') < 0) && <button className="tmform" onClick={() => {moveItem(roleindex, roleindex+1)}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-circle" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V4.5z"/>
</svg> Move Down</button>}</p>
 
</div>            
            )
        } )
    }
    {indexend > 1 && blanks && <p className="rb"><button  className="tmform" onClick={removeBlanks}>Remove Blanks for {props.role}</button> </p>}
    {notification && <div className="tm-notification tm-notification-success suggestion-notification">{notification}</div>}
    {props.editor && <p><NumberControl min="1" value={count} onChange={(value) => {/*setCount(value);*/ updateCount(value); } } /></p>}
    <p>Editor {props.editor}</p>
    </>
    )


}

//            {('Speaker' == attrs.role) && <p><strong>Intro</strong> <TextareaControl className="mce" value={(assignment.intro) ? assignment.intro : ''} onChange={(value) => {updateSpeech(value,'intro',roleindex)}} /> <RichText value={(assignment.intro) ? assignment.intro : ''} onChange={(value) => {updateSpeech(value,'intro',roleindex)}} allowedFormats={ [ 'core/bold', 'core/italic' ] } tagName="p" /></p>}
