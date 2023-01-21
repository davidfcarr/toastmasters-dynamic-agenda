import React, {useState, useEffect, useRef} from "react"
import apiClient from './http-common.js';
import {useQuery,useMutation, useQueryClient} from 'react-query';
import { __experimentalNumberControl as NumberControl, TextareaControl, SelectControl, ToggleControl, RadioControl, TextControl } from '@wordpress/components';
import RoleBlock from "./RoleBlock.js";
import {Inserter} from "./Inserter.js";
import {SanitizedHTML} from "./SanitizedHTML.js";
import {EditorAgendaNote} from './EditorAgendaNote.js';
import {EditableNote} from './EditableNote.js';

export default function Agenda2() {
    let initialPost = 0;
    if('rsvpmaker' == wpt_rest.post_type) {
        initialPost = wpt_rest.post_id;
    } else {
        initialPost = new URL(document.location).searchParams.get('post_id');
        if(!initialPost)
            initialPost = 0;
    }
    const [post_id, setPostId] = useState(initialPost);
    const [current_user_id,setCurrentUserId] = useState(0);
    const [mode, setMode] = useState('signup');

    const queryClient = useQueryClient();
    const { isLoading, isSuccess, isError, data:axiosdata, error, refetch} =
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
        queryClient.setQueryData("blocks-data", (old) => {
            old.data.blocksdata[blockindex].assignments[roleindex] = assignment;
            return old;//assign to query data
            console.log('old.blocksata');
            console.log(old.blocksdata);
            let copydata = {...old.data};
            old.data.blocksdata[blockindex].assignments[roleindex] = assignment;
            console.log('copydata update');
            console.log(copydata.blocksdata[blockindex].assignments[roleindex]);
            return ({...old,'data':copydata})
        })
        return previousValue;
   },
            /*
    
    
            // 성공한다고 가정하고 todos 데이터 즉시 업데이트.
            queryClient.setQueryData("blocks-data", (old) => {
                old.data.blocksdata[blockindex].assignments[roleindex] = assignment;
                console.log('old.data.blocksdata');
                console.log(old.data.blocksdata);
                console.log(old.data.blocksdata[blockindex].assignments);
                return old;

                console.log('old.blocksata');
                console.log(old.blocksdata);
                let copydata = {...old.data};
                old.data.blocksdata[blockindex].assignments[roleindex] = assignment;
                console.log('copydata update');
                console.log(copydata.blocksdata[blockindex].assignments[roleindex]);
                return ({...old,'data':copydata})
        })
    
            return previousValue;
          },
  */
         // On failure, roll back to the previous value
          onError: (err, variables, context) => {
            console.log('mutate assignment error');
            console.log(err);
            queryClient.setQueryData("blocks-data", context.previousValue);
          },
          // After success or failure, refetch the todos query
          onSettled: () => {
            /*
            const {blockindex, roleindex} = data;
            queryClient.setQueryData("blocks-data", (old) => {
                let newblocksdata = old.data.blocksdata;
                newblocksdata[blockindex].assignments[roleindex] = data; 
                return {...old, 
                    data: {...old.data, blocksdata: newblocksdata}
                }
            });
            */
            console.log('successful update, invalidating query');
            queryClient.invalidateQueries("blocks-data");
            console.log(data);
            makeNotification('Updated assignment');
          }
        }
    );

    const multiAssignmentMutation = useMutation(
        (multi) => { apiClient.post("json_multi_assignment_post", multi)},
        {
        
          // Optimistically update the cache value on mutate, but store
          // the old value and return it so that it's accessible in case of
          // an error
          //,blockindex,roleindex
          onMutate: async (multi) => {
            const {blockindex} = multi;
            await queryClient.cancelQueries('blocks-data');
    
            const previousValue = queryClient.getQueryData("blocks-data");
    
            // 성공한다고 가정하고 todos 데이터 즉시 업데이트.
            queryClient.setQueryData("blocks-data", (old) => { 
                old.data.blocksdata[blockindex].assignments = multi.assignments;
                return ({...old})
        })
    
            return previousValue;
          },
          // On failure, roll back to the previous value
          onError: (err, variables, previousValue) => {
            console.log('mutate assignment error');
            console.log(err);
            queryClient.setQueryData("blocks-data", previousValue);
          },
          // After success or failure, refetch the todos query
          onSettled: () => {
            queryClient.invalidateQueries("blocks-data");
            makeNotification('Updated assignments');
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
            setPostId(e.post_id);
            console.log('user id on init '+e.post_id);
        }
    }
    function onError(e) {
        console.log(e);
    }

    function getMoveAbleBlocks () {
        let moveableBlocks = [];
        data.blocksdata.map((block, blockindex) => {
            if(('wp4toastmasters/role' == block.blockName) || ('wp4toastmasters/agendanoterich2' == block.blockName) || ('wp4toastmasters/agendaedit' == block.blockName))
                moveableBlocks.push(blockindex);
            } )
        return moveableBlocks;
    }

    function moveBlock(blockindex, direction = 'up') {
        let moveableBlocks = getMoveAbleBlocks();
        console.log('moveable');
        console.log(moveableBlocks);
        let newposition = moveableBlocks[0];//move to top
        let foundindex = moveableBlocks.indexOf(blockindex);
        console.log('found index '+foundindex+' for blockindex' + blockindex)
        if(direction == 'up')
            newposition = moveableBlocks[foundindex - 1];
        else if(direction == 'down')
            newposition = moveableBlocks[foundindex + 2];
        if(direction == 'delete') {
            console.log('delete from '+blockindex);
            data.blocksdata.splice(blockindex,2);
        }
        else {
            console.log('new position:'+newposition+' from '+blockindex);
            let currentblock = data.blocksdata[blockindex];
            data.blocksdata.splice(newposition,0,currentblock,{'blockName':null,'attrs':[],'innerBlocks':[],'innerContent':"\n\n",'innerHTML':"\n\n"}); 
            
            let deletefrom = (newposition > blockindex) ? blockindex : blockindex + 2;
            console.log('move '+blockindex+' to '+newposition+' delete from '+deletefrom);
            console.log('delete from '+deletefrom);
            data.blocksdata.splice(deletefrom,2);    
        }
        console.log(data.blocksdata);
        
        data.changed = 'blocks';
        updateAgenda.mutate(data);
    }

    function insertBlock(blockindex, attributes={}, blockname = 'wp4toastmasters/role') {
        let newblocks = [];
        data.blocksdata.forEach(
            (block, index) => {
                newblocks.push(block);
                if(index == blockindex) {
                    newblocks.push({'blockName': blockname, 'assignments': [], 'attrs': attributes});
                }
            }
        );
        data.blocksdata = newblocks;
        updateAgenda.mutate(data);
    }

    function replaceBlock(blockindex, newblock) {
        let newblocks = [];
        data.blocksdata.forEach(
            (block, index) => {
                
                if(index == blockindex) {
                    newblocks.push(newblock);
                }
                else {
                    newblocks.push(block);
                }
            }
        );
        data.blocksdata = newblocks;
        updateAgenda.mutate(data);
    }

    function updateAttrs (newattrs, blockindex) {
        data.blocksdata[blockindex].attrs = newattrs;
        data.changed = 'attrs';
        updateAgenda.mutate(data);
    }

    function updateAssignment (assignment, blockindex = null, roleindex=null, start = 1) {
        //embed index properties if passed to the function separately
        if(Array.isArray(assignment))
            {
            return multiAssignmentMutation.mutate({'assignments':assignment,'blockindex':blockindex,'post_id':post_id,'start':start});
            }
        else {
        if(roleindex)
            assignment.roleindex = roleindex;
        if(roleindex)
            assignment.start = roleindex;
        assignment.post_id = post_id;
        assignmentMutation.mutate(assignment);
        }
}

const [notification,setNotification] = useState(null);
const [notificationTimeout,setNotificationTimeout] = useState(null);
function makeNotification(message, rawhtml = false) {
    if(notificationTimeout)
        clearTimeout(notificationTimeout);
    setNotification(message);
    let nt = setTimeout(() => {
        setNotification(null);
    },25000);
    setNotificationTimeout(nt);
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

function NextMeetingPrompt() {
    let pid = data.upcoming.findIndex((item) => item.value == post_id);
    if(data.upcoming[pid +1])
        return <div className="next-meeting-prompt">Would you like to sign up for the <a href={data.upcoming[pid +1].permalink}>Next meeting?</a></div>
    else
        return null;
}
        //(notification.findIndex(() => 'Assignment updated') > -1)

function ModeControl() {
    const modeoptions = (data.user_can_edit_post) ? [{'label': 'Sign Up', 'value':'signup'},{'label': 'Edit', 'value':'edit'},{'label': 'Suggest', 'value':'suggest'},{'label': 'Reorganize', 'value':'reorganize'},{'label': 'Insert/Delete', 'value':'insertdelete'}] : [{'label': 'Sign Up', 'value':'signup'},{'label': 'Edit', 'value':'edit'},{'label': 'Suggest', 'value':'suggest'}];

    return (
    <div id="fixed-mode-control">
        {notification && <div className="tm-notification tm-notification-success suggestion-notification">{notification} <NextMeetingPrompt /></div>}
        <RadioControl className="radio-mode" selected={mode} label="Mode" onChange={(value)=> setMode(value)} options={modeoptions}/>
        </div>)
}

    if(isLoading)
        return <p>Loading ...</p>;

    //console.log('current_user_id ' + agenda.current_user_id);
    const data = axiosdata.data;
    const raw = ['core/image','core/paragraph','core/heading','wp4toastmasters-signupnote']
    const ignore = ['wp4toastmasters/agendanoterich2','wp4toastmasters/milestone','wp4toastmasters/help']
    if(!post_id)
        setPostId(data.post_id);
    if(!current_user_id)
        setCurrentUserId(data.current_user_id);

    return (
        <div className="agendawrapper">
            {('rsvpmaker' != wpt_rest.post_type) && <SelectControl label="Choose Event" value={post_id} options={data.upcoming} onChange={(value) => setPostId(parseInt(value))} />}
            <ModeControl />
            {data.blocksdata.map((block, blockindex) => {
                if(!block.blockName)
                    return;
                if('wp4toastmasters/role' == block.blockName) {
                    return (
                    <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                    <RoleBlock agendadata={data} post_id={post_id} apiClient={apiClient} blockindex={blockindex} mode={mode} attrs={block.attrs} assignments={block.assignments} updateAssignment={updateAssignment} />
                    {('reorganize' == mode) && <p><button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }>Move {block.attrs.role} Role Up</button> <button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }>Move {block.attrs.role} Role Down</button></p>}
                    {('reorganize' == mode) && <div className="tmflexrow"><div className="tmflex30"><NumberControl label="Signup Slots" min="1" value={block.attrs.count} onChange={ (value) => { data.blocksdata[blockindex].attrs.count = value; updateAgenda.mutate(data); }} /></div><div className="tmflex30"><NumberControl label="Time Allowed" value={block.attrs?.time_allowed} onChange={ (value) => { data.blocksdata[blockindex].attrs.time_allowed = value; updateAgenda.mutate(data); }} /></div></div>}
                    {('insertdelete' == mode) && <div><p><button className="blockmove" onClick={() => {moveBlock(blockindex, 'delete')}}>Delete</button></p><Inserter blockindex={blockindex} insertBlock={insertBlock} /></div>}
                    </div>)
                }
                //                    {('wp4toastmasters/role' == insert) && <p><SelectControl value='' options={[{'label':'Choose Role','value':''},{'label':'Speaker','value':'Speaker'},{'label':'Topics Master','value':'Topics Master'},{'label':'Evaluator','value':'Evaluator'},{'label':'General Evaluator','value':'General Evaluator'},{'label':'Toastmaster of the Day','value':'Toastmaster of the Day'}]} onChange={(value) => {insertBlock(blockindex,{'role':value,'count':1});setInsert('')} } /></p>}
                if('wp4toastmasters/agendanoterich2' == block.blockName && ('reorganize' == mode)) {
                    return (
                    <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                    <SanitizedHTML innerHTML={block.innerHTML} />
                    <p><button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }>Move Down</button> <button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }>Move Up</button> {("wp4toastmasters/role" == block.blockName) && block.attrs.count}</p>
                    </div>)
                }
                if('wp4toastmasters/agendanoterich2' == block.blockName && ('edit' == mode) && data.user_can_edit_post ) {
                    return (
                    <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                    <EditorAgendaNote blockindex={blockindex} block={block} replaceBlock={replaceBlock} />
                    <p><button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }>Move Down</button> <button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }>Move Up</button> {("wp4toastmasters/role" == block.blockName) && block.attrs.count}</p>
                    </div>)
                }
                //wp:wp4toastmasters/agendaedit {"editable":"Welcome and Introductions","uid":"editable16181528933590.29714489144034184","time_allowed":"5","inline":true}
                if('wp4toastmasters/agendaedit' == block.blockName) {
                    if('edit' == mode) {
                        if(data.user_can_edit_post)
                        return (
                            <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                            <EditableNote mode={mode} block={block} uid={block.attrs.uid} makeNotification={makeNotification} />
                            </div>
                        );
                        else
                            return null;
                    }
                    else if('reorganize' == mode) {
                        return (
                            <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                            <EditableNote mode={mode} block={block} uid={block.attrs.uid} makeNotification={makeNotification} />
                            <p><button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }>Move Down</button> <button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }>Move Up</button> {("wp4toastmasters/role" == block.blockName) && block.attrs.count}</p>
                            </div>
                        );
                    }
                    else {
                        return (
                            <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                            <EditableNote mode={mode} block={block} uid={block.attrs.uid} makeNotification={makeNotification} />
                            </div>
                        );
                    }

                }
                if(raw.includes(block.blockName) && block.innerHTML)
                    return (<div key={'block'+blockindex} id={'block'+blockindex} className="block" >
                    <SanitizedHTML innerHTML={block.innerHTML} />
                    </div>);
                else
                    return null; //<p key={'block'+blockindex} id={'block'+blockindex} className="block">{blockindex}: {block.blockName} <button onClick={() => { moveBlock(blockindex, 'down') } }>Move Down</button> <button onClick={() => { moveBlock(blockindex, 'up') } }>Move Up</button></p>
                } )}
                    
        </div>
    );
}
