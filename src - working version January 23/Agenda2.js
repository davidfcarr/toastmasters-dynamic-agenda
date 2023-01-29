import React, {useState, useEffect, useRef} from "react"
import apiClient from './http-common.js';
import {useQuery,useMutation, useQueryClient} from 'react-query';
import { __experimentalNumberControl as NumberControl, TextareaControl, SelectControl, ToggleControl, RadioControl, TextControl } from '@wordpress/components';
import RoleBlock from "./RoleBlock.js";
import {Inserter} from "./Inserter.js";
import {SanitizedHTML} from "./SanitizedHTML.js";
import {EditorAgendaNote} from './EditorAgendaNote.js';
import {EditableNote} from './EditableNote.js';

export default function Agenda() {
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
    const [updating, setUpdating] = useState('');

    const queryClient = useQueryClient();
    const { isLoading, isSuccess, isError, data:axiosdata, error, refetch} =
    useQuery('blocks-data', fetchBlockData, { enabled: true, retry: 2, onSuccess, onError, refetchInterval: 10000 });
    function fetchBlockData() {
        return apiClient.get('blocks_data/'+post_id);
    }
    
    const assignmentMutation = useMutation(
            async (assignment) => { return await apiClient.post("json_assignment_post", assignment)},
            {
                onSuccess: (data, error, variables, context) => {
                    console.log('assignment update success',data);
                    queryClient.setQueryData("blocks-data", data);
                    queryClient.invalidateQueries('blocks-data');
                    makeNotification('Updated assignment');
                },
                onError: (err, variables, context) => {
                    console.log('mutate assignment error',err);
                    //queryClient.setQueryData("blocks-data", context.previousValue);
                },
            }
        );

          // Optimistically update the cache value on mutate, but store
          // the old value and return it so that it's accessible in case of
          // an error
          //,blockindex,roleindex
/*
        onMutate: async (assignment) => {
        console.log('onmutate assign ' + assignment.role+ ': '+ assignment.roleindex +' to '+assignment.name);
        //console.log('assignment object received by onMutate', assignment);
        const {roleindex,blockindex} = assignment;
        await queryClient.cancelQueries('blocks-data');
        const previousValue = queryClient.getQueryData("blocks-data");
        queryClient.setQueryData("blocks-data", (old) => {
            console.log('blockindex',blockindex);
            console.log('old', old);
            old.data.blocksdata[blockindex].assignments[roleindex] = assignment;
            console.log('assignmentMutation setQueryData', old);
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
          // After success or failure, refetch the todos query
          /*
          onSettled: () => {
            console.log('successful assignment update, invalidating query');
            queryClient.invalidateQueries("blocks-data");
            makeNotification('Updated assignment');
          }
          
        }*/

    const multiAssignmentMutation = useMutation(
        async (multi) => { return await apiClient.post("json_multi_assignment_post", multi)},
        {

            onSuccess: (data, error, variables, context) => {
                queryClient.invalidateQueries('blocks-data');
                queryClient.setQueryData("blocks-data", data);
                makeNotification('Updated assignments list');
                console.log('Updated assignments list',data);
            },
            onError: (err, variables, context) => {
                console.log('mutate assignment error');
                console.log(err);
                //queryClient.setQueryData("blocks-data", context.previousValue);
              },
            } );
    
        
          // Optimistically update the cache value on mutate, but store
          // the old value and return it so that it's accessible in case of
          // an error
          //,blockindex,roleindex
         /*
          onMutate: async (multi) => {
            await queryClient.cancelQueries('blocks-data');
            const {blockindex} = multi;    
            const previousValue = queryClient.getQueryData("blocks-data");
            multi.assignments.forEach((assignment, roleindex) => {
                console.log('onmutate assign '+assignment.role+ ': '+roleindex+' to '+assignment.name);
            } );
            // 성공한다고 가정하고 todos 데이터 즉시 업데이트.
            queryClient.setQueryData("blocks-data", (old) => { 
                old.data.blocksdata[blockindex].assignments = multi.assignments;
                console.log('old data, new assignments',old);
                console.log('just the assignments',old.data.blocksdata[blockindex].assignments);
                return (old)
        })
    
            return previousValue;
          },

          */
          // On failure, roll back to the previous value
          // After success or failure, refetch the todos query
/*          onSettled: () => {
            queryClient.invalidateQueries("blocks-data");
            makeNotification('Updated assignments list');
          }
        }
*/

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
        if(e.current_user_id) {
            setCurrentUserId(e.current_user_id);
            setPostId(e.post_id);
            console.log('user id on init '+e.post_id);
        }
        setUpdating('');
        console.log('donloaded data',e);
    }
    function onError(e) {
        console.log('error downloading data',e);
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
        console.log('moveable',moveableBlocks);
        let newposition = moveableBlocks[0];//move to top
        let foundindex = moveableBlocks.indexOf(blockindex);
        console.log('found index '+foundindex+' for blockindex' + blockindex)
        if(direction == 'up')
            newposition = moveableBlocks[foundindex - 1];
        else if(direction == 'down')
            newposition = moveableBlocks[foundindex + 1];
        if(direction == 'delete') {
            console.log('delete from '+blockindex);
            data.blocksdata.splice(blockindex,1);
        }
        else {
            console.log('reorg new position:'+newposition+' from '+blockindex);
            let currentblock = data.blocksdata[blockindex];
            data.blocksdata.splice(newposition,0,currentblock,{'blockName':null,'attrs':[],'innerBlocks':[],'innerContent':"\n\n",'innerHTML':"\n\n"}); 
            
            let deletefrom = (newposition > blockindex) ? blockindex : blockindex + 1;
            console.log('reorg move '+blockindex+' to '+newposition+' delete from '+deletefrom);
            console.log('reorg delete from '+deletefrom);
            data.blocksdata.splice(deletefrom,2);
            console.log('reorg',data.blocksdata);    
        }
        console.log('move blocks, new blocks',data.blocksdata);
        
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

    function updateAssignment (assignment, blockindex = null, start=1) {
        setUpdating('Updating ...');
        //embed index properties if passed to the function separately
        console.log('assignment received by updateAssignment', assignment);

        if(Array.isArray(assignment))
            {
            assignment = assignment.map((a) => { return {...a, post_id:post_id} });
            return multiAssignmentMutation.mutate({'assignments':assignment,'blockindex':blockindex,'start':1});
            }
        else {
        assignment.post_id = post_id;
        console.log('assign '+assignment.role+':'+assignment.roleindex+' to '+assignment.ID+' '+assignment.name);
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

function NextMeetingPrompt() {
    let pid = data.upcoming.findIndex((item) => item.value == post_id);
    if(data.upcoming[pid +1])
        return <div className="next-meeting-prompt">Would you like to sign up for the <a href={data.upcoming[pid +1].permalink+'?newsignup'}>Next meeting?</a></div>
    else
        return null;
}
        //(notification.findIndex(() => 'Assignment updated') > -1)

function ModeControl() {
    const modeoptions = (data.user_can_edit_post) ? [{'label': 'Sign Up', 'value':'signup'},{'label': 'Edit', 'value':'edit'},{'label': 'Suggest', 'value':'suggest'},{'label': 'Reorganize', 'value':'reorganize'},{'label': 'Insert/Delete', 'value':'reorganize'}] : [{'label': 'Sign Up', 'value':'signup'},{'label': 'Edit', 'value':'edit'},{'label': 'Suggest', 'value':'suggest'}];

    return (
    <div id="fixed-mode-control">
        {notification && <div className="tm-notification tm-notification-success suggestion-notification">{updating} {notification} <NextMeetingPrompt /></div>}
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

    console.log('data for agenda return', data);

    return (
        <div className="agendawrapper">
            {('rsvpmaker' != wpt_rest.post_type) && <SelectControl label="Choose Event" value={post_id} options={data.upcoming} onChange={(value) => setPostId(parseInt(value))} />}
            <ModeControl />
            {data.blocksdata.map((block, blockindex) => {
                if(!block.blockName)
                    return;
                if('wp4toastmasters/role' == block.blockName) {
                    block.assignments.forEach( (assignment,roleindex) => {console.log(block.attrs.role +': '+roleindex+' name:'+assignment.name)} );
                    return (
                    <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                    <p>{block.assignments.map( (item) => {return item.name }).join(', ')}</p>
                    <RoleBlock agendadata={data} post_id={post_id} apiClient={apiClient} blockindex={blockindex} mode={mode} attrs={block.attrs} assignments={block.assignments} updateAssignment={updateAssignment} />
                    {('reorganize' == mode) && <p><button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }>Move {block.attrs.role} Role Up</button> <button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }>Move {block.attrs.role} Role Down</button></p>}
                    {('reorganize' == mode) && <div className="tmflexrow"><div className="tmflex30"><NumberControl label="Signup Slots" min="1" value={block.attrs.count} onChange={ (value) => { data.blocksdata[blockindex].attrs.count = value; updateAgenda.mutate(data); }} /></div><div className="tmflex30"><NumberControl label="Time Allowed" value={block.attrs?.time_allowed} onChange={ (value) => { data.blocksdata[blockindex].attrs.time_allowed = value; updateAgenda.mutate(data); }} /></div></div>}
                    {('reorganize' == mode) && <div><p><button className="blockmove" onClick={() => {moveBlock(blockindex, 'delete')}}>Delete</button></p><Inserter blockindex={blockindex} insertBlock={insertBlock} /></div>}
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
