import React, {useState, useEffect, useRef} from "react"
import apiClient from './http-common.js';
import {useQuery,useMutation, useQueryClient} from 'react-query';
import { TextareaControl, SelectControl, ToggleControl, RadioControl, TextControl } from '@wordpress/components';
import RoleBlock from "./RoleBlock.js";
//import * as DOMPurify from 'dompurify';

export default function Agenda2() {
    let initialPost = 0;
    if('rsvpmaker' == wpt_rest.post_type) {
        initialPost = wpt_rest.post_id;
    } else {
        initialPost = new URL(document.location).searchParams.get('post_id');
        if(!initialPost)
            initialPost = 0;    
    }
    const [current_user_id, setCurrentUserId] = useState(0);
    const [post_id, setPostId] = useState(initialPost);
    const [mode, setMode] = useState('view');

    const queryClient = useQueryClient();
    const { isLoading, isSuccess, isError, data:axiosdata, error, refetch } =
    useQuery('blocks-data', fetchBlockData, { enabled: true, retry: 2, onSuccess, onError });
    function fetchBlockData() {
        return apiClient.get('blocks_data/'+post_id);
    }
    
    const assignmentMutation = useMutation(
        (assignment) => { apiClient.post("json_assignment_post", assignment)},
        {
        
          // Optimistically update the cache value on mutate, but store
          // the old value and return it so that it's accessible in case of
          // an error
          //,blockindex,roleindex
          onMutate: async (assignment) => {
            console.log('assignment object received by onMutate');
            console.log(assignment);
            const {roleindex,blockindex} = assignment;
            await queryClient.cancelQueries('blocks-data');
    
            const previousValue = queryClient.getQueryData("blocks-data");
    
            // 성공한다고 가정하고 todos 데이터 즉시 업데이트.
            queryClient.setQueryData("blocks-data", (old) => { 
                old.data.blocksdata[blockindex].assignments[roleindex] = assignment;
                return ({...old})
        })

            /*    let newdata = {...old};
                //console.log('newdata');
                //console.log(newdata);
                console.log('assignment');
                console.log(assignment);
                console.log(newdata.blocksdata[assignment.blockindex]);
                console.log(newdata.blocksdata[assignment.blockindex].assignments);
                newdata.blocksdata[assignment.blockindex].assignments[assignment.roleindex] = assignment;
                console.log('newdata');
                console.log(newdata);
                return newdata;
            */
    
            return previousValue;
          },
          // On failure, roll back to the previous value
          onError: (err, variables, previousValue) => {
            console.log('mutate assignment error');
            console.log(err);
            queryClient.setQueryData("blocks-data", previousValue);
          },
          // After success or failure, refetch the todos query
          onSuccess: () => {
            queryClient.invalidateQueries("blocks-data");
            makeNotification('Updated assignment');
          }
        }
    );
    
    function updateAgendaPost (agenda) {
        return apiClient.post('update_agenda', agenda);
    }

    const updateAgenda = useMutation(updateAgendaPost, {
            onSuccess: (data, error, variables, context) => {
                queryClient.invalidateQueries('blocks-data');
            }    
          }
    )

    function onSuccess(e) {
        console.log(e);
        if(e.current_user_id) {
            setCurrentUserId(e.current_user_id);
            setMode('signup'); // logged in user ready to sign up
        }
    }
    function onError(e) {
        console.log(e);
    }

    function moveBlock(blockindex, direction = 'up') {
        let newposition = 0;//move to top
        if(direction == 'up')
            newposition = blockindex - 2;
        else if(direction == 'down')
            newposition = blockindex + 4;

        let currentblock = data.blocksdata[blockindex];
        let next = (data.blocksdata > blockindex) ? data.blocksdata[blockindex+1] : null;
        //insert at new position, followed by blank
        data.blocksdata.splice(newposition,0,currentblock,{'blockName':null,'attrs':[],'innerBlocks':[],'innerContent':"\n\n",'innerHTML':"\n\n"}); 
        let deletefrom = (newposition > blockindex) ? blockindex : blockindex + 2;
        console.log('move '+blockindex+' to '+newposition+' delete from '+deletefrom);
        console.log('delete from '+deletefrom);
        data.blocksdata.splice(deletefrom,2);
        console.log(data.blocksdata);
        data.changed = 'blocks';
        updateAgenda.mutate(data);
    }

    function updateAttrs (newattrs, blockindex) {
        data.blocksdata[blockindex].attrs = newattrs;
        data.changed = 'attrs';
        updateAgenda.mutate(data);
    }

    function updateAssignment (assignment, blockindex = null, roleindex=null) {
        //embed index properties if passed to the function separately
        if(blockindex)
            assignment.blockindex = blockindex;
        if(roleindex)
            assignment.roleindex = roleindex;
        assignment.post_id = post_id;
        assignmentMutation.mutate(assignment);
        //{'ID':1,'name':'David','blockindex':blockindex,'roleindex':0,'post_id':post_id,'role':block.attrs.role}
        //data.blocksdata[blockindex].assignments[roleindex] = assignment;
        //data.changed = 'assignment';
        //updateAgenda.mutate(data);
    }

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



    if(isLoading)
        return <p>New Loading ...</p>;
    //console.log('current_user_id ' + agenda.current_user_id);
    const data = axiosdata.data;
    const raw = ['core/image','core/paragraph','core/heading','wp4toastmasters-signupnote']
    const ignore = ['wp4toastmasters/agendanoterich2','wp4toastmasters/milestone','wp4toastmasters/help']
    return (
        <div className="agendawrapper">
            {data.blocksdata.map((block, blockindex) => {
                if(!block.blockName)
                    return;
                if('wp4toastmasters/role' == block.blockName) {
                    return (
                    <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                    <RoleBlock agendadata={data} apiClient={apiClient} blockindex={blockindex} mode={mode} attrs={block.attrs} assignments={block.assignments} updateAssignment={updateAssignment} />
                    {('reorganize' == mode) && <p><button onClick={() => { moveBlock(blockindex, 'down') } }>Move Down</button> <button onClick={() => { moveBlock(blockindex, 'up') } }>Move Up</button> {("wp4toastmasters/role" == block.blockName) && block.attrs.count && <TextControl label="Number of Signup Slots" value={block.attrs.count} onChange={ (value) => { data.blocksdata[blockindex].attrs.count = value; updateAgenda.mutate(data); }} />}</p>}
                    <RadioControl className="radio-mode" selected={mode} label="Mode" onChange={(value)=> setMode(value)} options={[{'label': 'Edit Assignents', 'value':'edit'},{'label': 'Suggest Assignments', 'value':'suggest'},{'label': 'Reorganize', 'value':'reorganize'},{'label': 'Sign Up', 'value':'signup'},{'label': 'View', 'value':'view'}]}/>
                    </div>)
                }
                if('wp4toastmasters/agendanoterich2' == block.blockName) {
                    return (
                    <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                    <p>{blockindex}: {block.blockName} <button onClick={() => { moveBlock(blockindex, 'down') } }>Move Down</button> <button onClick={() => { moveBlock(blockindex, 'up') } }>Move Up</button></p>
                    <p>{block.innerHTML.replace( /(<([^>]+)>)/ig, '')}</p>
                    <p><button onClick={() => { moveBlock(blockindex, 'down') } }>Move Down</button> <button onClick={() => { moveBlock(blockindex, 'up') } }>Move Up</button> {("wp4toastmasters/role" == block.blockName) && block.attrs.count && <TextControl value={block.attrs.count} onChange={ (value) => { data.blocksdata[blockindex].attrs.count = value; updateAgenda.mutate(data); }} />}</p>
                    </div>)
                }
                if(block.innerHTML)
                    return null; //<div key={'block'+blockindex} id={'block'+blockindex} className="block" dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(block.innerHTML)}}></div>
                else
                    return null; //<p key={'block'+blockindex} id={'block'+blockindex} className="block">{blockindex}: {block.blockName} <button onClick={() => { moveBlock(blockindex, 'down') } }>Move Down</button> <button onClick={() => { moveBlock(blockindex, 'up') } }>Move Up</button></p>
                } )}
        
        {notification && <div className="tm-notification tm-notification-success suggestion-notification">{notification}</div>}
            
        </div>
    );
}
