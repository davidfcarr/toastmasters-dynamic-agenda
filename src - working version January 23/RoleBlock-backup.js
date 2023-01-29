import React, {useState, useEffect} from "react"
import { __experimentalNumberControl as NumberControl, SelectControl, ToggleControl, TextControl } from '@wordpress/components';
//import {RichText} from '@wordpress/components'
import EditorMCE from './EditorMCE.js'
import ProjectChooser from "./ProjectChooser.js";
import Suggest from "./Suggest.js";

export default function RoleBlock (props) {
    const [assignments,setAssignments] = useState(props.assignments);
    const [memberlist,setMemberList] = useState([]);
    const [editing,setEditing] = useState(false);
    const [suggest,setSuggest] = useState(false);
    const [viewTop,setViewTop] = useState('');
    const [count,setCount] = useState((props.count) ? props.count : 1);
    let roles = [];
    let roletagbase = '_'+props.role.replaceAll(' ','_')+'_';

    useEffect( () => {
        fetch(wpt_rest.url + 'rsvptm/v1/members_for_role/'+roletagbase+'/'+props.post_id, {headers: {'X-WP-Nonce': wpt_rest.nonce}})
        .then((response) => response.json())
        .then((data) => {
            setMemberList(data);
        });
    },[]);

    useEffect( () => {
        scrolltoId(viewTop);
    },[viewTop]);

    useEffect( () => {
        updateAssignments();
    },[assignments]);

    const [notification,setNotification] = useState(null);
    function makeNotification(message, rawhtml = false) {
      setNotification(message);
      setTimeout(() => {
          setNotification(null);
      },5000);
  }

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

    function roleBlockAssign(role, roleindex = 0, user_id = null) {
        let url = wpt_rest.url + 'rsvptm/v1/editor_assign';
        const formData = new FormData();
        formData.append('action', 'editor_assign');
        formData.append('role', role);
        formData.append('user_id', user_id);
        formData.append('editor_id', props.current_user_id);
        formData.append('post_id', props.post_id);
        formData.append('timelord', rsvpmaker_rest.timelord);
        //console.log('formData');
        //console.log(formData);
        fetch(url, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            headers: {
              'X-WP-Nonce': wpt_rest.nonce,
            },
            body: formData
          })
        .then((response) => {return response.json()})
        .then((responsedata) => {
            if(responsedata.status) {
                let newassignments = [];
                setAssignments( (prev) => {
                    prev.forEach( (assignment, aindex) => {
                        if(aindex == roleindex) {
                            assignment.ID = user_id;
                            assignment.name = responsedata.name;
                            console.log('checking for speaker reset');
                            console.log(user_id + 'test: '+(user_id == 0));
                            console.log(role+' test '+role.search('peaker'));
                            if((user_id == 0) && role.search('peaker') > 0 )
                            {
                                assignment.title = '';
                                assignment.project = '';
                                assignment.manual = '';
                                assignment.intro = '';
                                assignment.maxtime = 7;
                                assignment.display_time = '5 - 7 minutes';
                            }
                        }
                        console.log('new assignment');
                        console.log(assignment);
                        newassignments.push(assignment);
                    } );
                    return newassignments;
                });
                //console.log(responsedata.status);
                //updateAssignments();
                props.setUpdated(Date.now());
            }
        });
    }

    function updateCount(newcount) {
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

    function moveItem(roleindex, newindex) {
        setAssignments((prev) => {
            //console.log('previous');
            //console.log(prev);
            let myassignment = prev[roleindex];
            let newassignments = [];
            prev.forEach((prevassignment,previndex) => {
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
            //console.log('new assignments after move');
            //console.log(newassignments);
            return newassignments;
        });
        //updateAssignments();
        scrolltoId(roletagbase+newindex);
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

    if(!props.current_user_id) {
        return (
            <>
            <p>{props.role} Count: {count}</p>
            {
                roles.map( (role, roleindex) => {
                        //console.log(role); 
                    if(typeof role.assigned === 'undefined')
                        {
                            //console.log('role assigned issue')
                            //console.log(role);
                            role.assigned = {'ID': 0, 'name': ''};
                        }
                        let showassigned = (role.assigned && role.assigned.ID) ? role.assigned.name : '';
                        let manual = role.assigned && role.assigned.manual ? role.assigned.manual : ''
                        return (<div><p><strong>{role.role}</strong> {role.number} {showassigned}</p>
                        {role.assigned.manual && <p><strong>Path</strong> {role.assigned.manual}</p>}
                        {role.assigned.project && <p><strong>Project</strong> {role.assigned.project}</p>}
                        {('Speaker' == role.role) && <p><strong>Title</strong> {(role.assigned.title) ? role.assigned.title : ''}</p>}
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
            if(typeof role.assigned === 'undefined')
                {
                    role.assigned = {'ID': 0, 'name': ''};
                }
            
            if(role.assigned.ID < 1)
                blanks = true;
            let showassigned = (role.assigned && role.assigned.ID) ? role.assigned.name : '';
            let manual = role.assigned && role.assigned.manual ? role.assigned.manual : 'Path Not Set Level 1 Mastering Fundamentals'
            let project = role.assigned && role.assigned.project ? role.assigned.project : '';
            return (<div className="rb" id={roletagbase+(roleindex+1)}><p><strong>{role.role}</strong> {(roles.length > 1) && role.number} {showassigned}</p>
            <div className="tmflexrow">
            {!editing && !suggest && !showassigned && <div><button  className="tmform" onClick={() => {roleBlockAssign(roletagbase+(roleindex+1),roleindex,props.current_user_id); setViewTop(roletagbase+(roleindex+1));}}>Take Role</button></div>}
                {(props.current_user_id != role.assigned.ID) && <div><ToggleControl label="Edit"
            help={
                editing
                    ? 'Editing'
                    : 'Viewing'
            }
            checked={ editing }
            onChange={ () => {
                setEditing( ( state ) => ! state );
                setSuggest(false);
                setViewTop(roletagbase+(roleindex+1));
            } } /></div>}
            
                {!role.assigned.ID && <div><ToggleControl label="Suggest"
            help={
                editing
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
            {(!editing && (props.current_user_id != role.assigned.ID)) && role.assigned.manual && <p><strong>Path</strong> {role.assigned.manual}</p>}
            {(!editing && (props.current_user_id != role.assigned.ID)) && (!editing && (props.current_user_id != role.assigned.ID)) && role.assigned.project && <p><strong>Project</strong> {role.assigned.project}</p>}
            {(!editing && (props.current_user_id != role.assigned.ID)) && ('Speaker' == role.role) && role.assigned.title && <p><strong>Title</strong> {(role.assigned.title) ? role.assigned.title : ''}</p>}
            {(!editing && (props.current_user_id != role.assigned.ID)) && ('Speaker' == role.role) && role.assigned.intro && <div><p><strong>Intro</strong></p><div dangerouslySetInnerHTML= {{__html:(role.assigned.intro) ? role.assigned.intro : ''}} /></div>}
            {(!editing && (props.current_user_id != role.assigned.ID)) && (role.role.search('Speaker') > -1) && role.assigned.display_time && <p><strong>Timing</strong> {(role.assigned.display_time) ? role.assigned.display_time : ''}</p>}
            {suggest && !role.assigned.ID && <Suggest memberlist={memberlist} roletag={roletagbase+(roleindex+1)} post_id={props.post_id} current_user_id={props.current_user_id} setSuggest={setSuggest} />}
            {role.assigned.ID > 0 && (editing || (props.current_user_id == role.assigned.ID)) && <button  className="tmform" onClick={() => {roleBlockAssign(roletagbase+(roleindex+1),roleindex,0); setEditing(true);setViewTop(roletagbase+(roleindex+1));}}>Reset</button>}
            {(editing && (props.current_user_id != role.assigned.ID)) && <SelectControl label="Select Member" value={role.assigned.ID} options={memberlist} onChange={(id) => { roleBlockAssign(roletagbase+role.number,roleindex,id); }} />}
            {(editing || (props.current_user_id == role.assigned.ID)) && (role.role.search('Speaker') > -1) && <ProjectChooser assigned={role.assigned} project={project} manual={manual} maxtime={role.assigned.maxtime} display_time={role.assigned.display_time} onChangeFunction={updateSpeech} index={roleindex} /> }
            {(editing || (props.current_user_id == role.assigned.ID)) && (role.role.search('Speaker') > -1) && (editing || role.assigned.ID == props.current_user_id) && <p><strong>Title</strong> <TextControl value={(role.assigned.title) ? role.assigned.title : ''} onChange={(value) => {updateSpeech(value,'title',roleindex)}} /></p>}
            {(editing || (props.current_user_id == role.assigned.ID)) && (role.role.search('Speaker') > -1) && (editing || role.assigned.ID == props.current_user_id) && <p><strong>Intro</strong> <EditorMCE value={(role.assigned.intro) ? role.assigned.intro : ''} updateSpeech={updateSpeech} updateAssignments={updateAssignments} param="intro" index={roleindex} /> </p>}
            
            {/*('Speaker' != props.role) && (editing || (role.assigned.ID == props.current_user_id)) && <button  className="tmform" onClick={updateAssignments}>Update</button>*/}
            
            <p>{(role.number > 1) && <><button  className="tmform" onClick={() => {moveToTop(roleindex)}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up-circle" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/></svg> Move to Top</button> <button  className="tmform" onClick={() => {moveItem(roleindex, roleindex-1)}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up-circle" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/></svg> Move Up</button></>} {(roles.length > 1) && (role.number < indexend) && (role.role.search('Backup') < 0) && <button className="tmform" onClick={() => {moveItem(roleindex, roleindex+1)}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-circle" viewBox="0 0 16 16">
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

//            {('Speaker' == role.role) && <p><strong>Intro</strong> <TextareaControl className="mce" value={(role.assigned.intro) ? role.assigned.intro : ''} onChange={(value) => {updateSpeech(value,'intro',roleindex)}} /> <RichText value={(role.assigned.intro) ? role.assigned.intro : ''} onChange={(value) => {updateSpeech(value,'intro',roleindex)}} allowedFormats={ [ 'core/bold', 'core/italic' ] } tagName="p" /></p>}
