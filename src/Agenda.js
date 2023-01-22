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
    const [newtemplate, setNewTemplate] = useState(0);
    const [allowEditStructure, setAllowEditStructure] = useState(false);
    
    const queryClient = useQueryClient();
    const { isLoading, isFetching, isSuccess, isError, data:axiosdata, error, refetch} =
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
                    makeNotification('Updated assignment',data.data.prompt);
                },
                onError: (err, variables, context) => {
                    console.log('mutate assignment error',err);
                    //queryClient.setQueryData("blocks-data", context.previousValue);
                },
            }
        );

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
    
    async function updateAgendaPost (agenda) {
        return await apiClient.post('update_agenda', agenda);
    }

    const updateAgenda = useMutation(updateAgendaPost, {
            onSuccess: (data, error, variables, context) => {
                queryClient.invalidateQueries('blocks-data');
                //queryClient.setQueryData("blocks-data", data);
                makeNotification('Updated agenda blocks');
                if(Inserter.setInsert)
                    Inserter.setInsert('');
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
        console.log('reorg found index '+foundindex+' for blockindex' + blockindex)
        if(direction == 'up')
            newposition = moveableBlocks[foundindex - 1];
        else if(direction == 'down')
            newposition = moveableBlocks[foundindex + 2];
        if(direction == 'delete') {
            console.log('delete from '+blockindex);
            data.blocksdata.splice(blockindex,2);
        }
        else {
            console.log('reorg new position:'+newposition+' from '+blockindex);
            console.log('reorg move blocks, current blocks',data.blocksdata);
            let currentblock = data.blocksdata[blockindex];
            data.blocksdata[blockindex] = {'blockName':null};
            data.blocksdata.splice(newposition,0,currentblock);
            console.log('reorg move '+blockindex+' to '+newposition);
        }
        console.log('reorg move blocks, new blocks',data.blocksdata);
        
        data.changed = 'blocks';
        updateAgenda.mutate(data);
    }

    function insertBlock(blockindex, attributes={}, blockname = 'wp4toastmasters/role',innerHTML) {
        let newblocks = [];
        data.blocksdata.forEach(
            (block, index) => {
                newblocks.push(block);
                if(index == blockindex) {
                    newblocks.push({'blockName': blockname, 'assignments': [], 'attrs': attributes,'innerHTML':innerHTML});
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
function makeNotification(message, prompt = false, otherproperties = null) {
    if(notificationTimeout)
        clearTimeout(notificationTimeout);
    setNotification({'message':message,'prompt':prompt,'otherproperties':otherproperties});
    let nt = setTimeout(() => {
        setNotification(null);
    },25000);
    setNotificationTimeout(nt);
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
    const modeoptions = (user_can('edit_post') || user_can('edit_structure')) ? [{'label': 'Sign Up', 'value':'signup'},{'label': 'Edit', 'value':'edit'},{'label': 'Suggest', 'value':'suggest'},{'label': 'Insert/Delete/Reorder Blocks', 'value':'reorganize'}] : [{'label': 'Sign Up', 'value':'signup'},{'label': 'Edit', 'value':'edit'},{'label': 'Suggest', 'value':'suggest'}];
    if(user_can('edit_post'))
        modeoptions.push({'label': 'Template/Settings', 'value':'settings'});

    return (
    <div id="fixed-mode-control">
        {notification && <div className="tm-notification tm-notification-success suggestion-notification">{updating} <SanitizedHTML innerHTML={notification.message} /> {notification.prompt && <NextMeetingPrompt />} {notification.otherproperties && notification.otherproperties.map( (property) => {if(property.template_prompt) return <div className="next-meeting-prompt"><a target="_blank" href={'/wp-admin/edit.php?post_type=rsvpmaker&page=rsvpmaker_template_list&t='+property.template_prompt}>Create/Update</a> - copy content to new and existing events</div>} )} {isFetching && <em>Fetching fresh data ...</em>}</div>}
        <RadioControl className="radio-mode" selected={mode} label="Mode" onChange={(value)=> setMode(value)} options={modeoptions}/>
        </div>)
}
    function user_can(permission) {
        if(axiosdata.data.permissions[permission])
            return axiosdata.data.permissions[permission];
        else
            return false;
    }

    if(isLoading)
        return <p>Loading ...</p>;
    if(!axiosdata.data.current_user_id) 
        return <p>You must be logged in as a member of this website to see the signup form.</p>

    //console.log('current_user_id ' + agenda.current_user_id);
    const data = axiosdata.data;
    const raw = ['core/image','core/paragraph','core/heading','wp4toastmasters-signupnote']
    const ignore = ['wp4toastmasters/agendanoterich2','wp4toastmasters/milestone','wp4toastmasters/help']
    let date = new Date(data.datetime);
    const dateoptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let timestamp = date.getMilliseconds();
    let datestring = '';
    if(!post_id)
        setPostId(data.post_id);
    if(!current_user_id)
        setCurrentUserId(data.current_user_id);


    console.log('data for agenda return', data);
    const moveableBlocks = getMoveAbleBlocks ();

    if('settings' == mode)
    {
        let templates = data.upcoming.map((item) => {if(item.label.indexOf('emplate')) return item});
        templates.push({'value':0,'label':'Choose Template'});
        return(
            <div className="agendawrapper">
            <ModeControl />
            <h2>Template Options and Settings</h2>
            <>{data.has_template && <div><p><button className="tmform" onClick={() => { makeNotification('Template updated (not really, still a demo).',false,[{'template_prompt':data.has_template}]);} }>Update Template</button></p><p><em>Click to apply changes you have made to this agenda document to the underlying template.</em></p></div>}</>
            <>{data.is_template && <p><a target="_blank" href={'/wp-admin/edit.php?post_type=rsvpmaker&page=rsvpmaker_template_list&t='+post_id}>Create/Update</a></p>}</>
            <SelectControl label="Apply a Different Template" value={newtemplate} options={templates} onChange={(value) => setNewTemplate(value)} />
            <p><button className="tmform" onClick={() => { makeNotification('This does not work yet') }}>Apply</button> <em>Use a different template, such as one for a contest.</em></p>
            <>{user_can('manage_options') && (
            <div className="adminonly"><h3>Admin Only Options Go Here</h3><p><ToggleControl label="Allow Regular Members to Edit Agenda Structure" checked={ allowEditStructure }
            onChange={ () => {
                setAllowEditStructure( ( state ) => ! state );
            } } /></p><p><em>If this is not set, only editors will be able to add, delete, or rearrange role and note blocks on a meeting agenda. Even with this turned on, only editors and administrators will have access to this Template Options and Settings screen.</em></p></div>)}</>
            </div>
        );
    }

    return (
        <div className="agendawrapper">
            {('rsvpmaker' != wpt_rest.post_type) && <SelectControl label="Choose Event" value={post_id} options={data.upcoming} onChange={(value) => {setPostId(parseInt(value)); makeNotification('Date changed, please wait for the date to change ...'); queryClient.invalidateQueries('blocks-data'); refetch();}} />}
            <h4>{date.toLocaleDateString('en-US',dateoptions)}</h4>
            <ModeControl />
            {data.blocksdata.map((block, blockindex) => {
                datestring = date.toLocaleTimeString('en-US',{hour: "2-digit", minute: "2-digit",hour12:true});
                if(block?.attrs?.time_allowed) {
                    console.log(block.blockName+' role '+block?.attrs?.role+' blocktime'+date.toLocaleTimeString('en-US',{hour: "2-digit", minute: "2-digit",hour12:true}));
                    console.log('blocktime add '+block.attrs.time_allowed+' minutes');
                    date.setMilliseconds(date.getMilliseconds() + (parseInt(block.attrs.time_allowed) * 60000) );
                    datestring = datestring+' to '+ date.toLocaleTimeString('en-US',{hour: "2-digit", minute: "2-digit",hour12:true});
                }
                if(!block.blockName)
                    return;
                if('wp4toastmasters/role' == block.blockName) {
                    block.assignments.forEach( (assignment,roleindex) => {console.log(block.attrs.role +': '+roleindex+' name:'+assignment.name)} );
                    return (
                    <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                    <div><strong>{datestring}</strong></div>
                    <RoleBlock agendadata={data} post_id={post_id} apiClient={apiClient} blockindex={blockindex} mode={mode} attrs={block.attrs} assignments={block.assignments} updateAssignment={updateAssignment} />
                    {('reorganize' == mode) && <p>{(blockindex > moveableBlocks[0]) && <button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }>Move {block.attrs.role} Role Up</button>} {(blockindex < moveableBlocks[moveableBlocks.length -1]) && <button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }>Move {block.attrs.role} Role Down</button>}</p>}
                    {('reorganize' == mode) && <div className="tmflexrow"><div className="tmflex30"><NumberControl label="Signup Slots" min="1" value={block.attrs.count} onChange={ (value) => { data.blocksdata[blockindex].attrs.count = value; updateAgenda.mutate(data); }} /></div><div className="tmflex30"><NumberControl label="Time Allowed" value={block.attrs?.time_allowed} onChange={ (value) => { data.blocksdata[blockindex].attrs.time_allowed = value; updateAgenda.mutate(data); }} /></div></div>}
                    {('reorganize' == mode) && <div><p><button className="blockmove" onClick={() => {moveBlock(blockindex, 'delete')}}>Delete</button></p><Inserter blockindex={blockindex} insertBlock={insertBlock} /></div>}
                    </div>)
                }
                //                    {('wp4toastmasters/role' == insert) && <p><SelectControl value='' options={[{'label':'Choose Role','value':''},{'label':'Speaker','value':'Speaker'},{'label':'Topics Master','value':'Topics Master'},{'label':'Evaluator','value':'Evaluator'},{'label':'General Evaluator','value':'General Evaluator'},{'label':'Toastmaster of the Day','value':'Toastmaster of the Day'}]} onChange={(value) => {insertBlock(blockindex,{'role':value,'count':1});setInsert('')} } /></p>}
                if('wp4toastmasters/agendanoterich2' == block.blockName && ('edit' == mode) && (user_can('edit_post') || user_can('edit_structure')) ) {
                    return (
                    <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                    <div><strong>{datestring}</strong></div>
                    <EditorAgendaNote blockindex={blockindex} block={block} replaceBlock={replaceBlock} />
                    {('reorganize' == mode) && <p>{(blockindex > moveableBlocks[0]) && <button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }>Move {block.attrs.role} Role Up</button>} {(blockindex < moveableBlocks[moveableBlocks.length -1]) && <button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }>Move {block.attrs.role} Role Down</button>}</p>}
                    </div>)
                }
                else if('wp4toastmasters/agendanoterich2' == block.blockName) {
                    return (
                    <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                    <div><strong>{datestring}</strong></div>
                    <SanitizedHTML innerHTML={block.innerHTML} />
                    {('reorganize' == mode) && <p>{(blockindex > moveableBlocks[0]) && <button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }>Move {block.attrs.role} Role Up</button>} {(blockindex < moveableBlocks[moveableBlocks.length -1]) && <button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }>Move {block.attrs.role} Role Down</button>}</p>}
                    </div>)
                }
                //wp:wp4toastmasters/agendaedit {"editable":"Welcome and Introductions","uid":"editable16181528933590.29714489144034184","time_allowed":"5","inline":true}
                if('wp4toastmasters/agendaedit' == block.blockName) {
                    if('edit' == mode) {
                        if((user_can('edit_post') || user_can('edit_structure')))
                        return (
                            <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                            <div><strong>{datestring}</strong></div>
                            <EditableNote mode={mode} block={block} uid={block.attrs.uid} post_id={post_id} makeNotification={makeNotification} />
                            {('reorganize' == mode) && <p>{(blockindex > moveableBlocks[0]) && <button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }>Move {block.attrs.role} Role Up</button>} {(blockindex < moveableBlocks[moveableBlocks.length -1]) && <button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }>Move {block.attrs.role} Role Down</button>}</p>}
                            </div>
                        );
                        else
                            return null;
                    }
                    else if('reorganize' == mode) {
                        return (
                            <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                            <EditableNote mode={mode} block={block} uid={block.attrs.uid} makeNotification={makeNotification} />
                            <p>{('reorganize' == mode) && (blockindex > moveableBlocks[0]) && <button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }>Move {block.attrs.role} Role Up</button>} {(blockindex < moveableBlocks[moveableBlocks.length -1]) && <button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }>Move {block.attrs.role} Role Down</button>}</p>
                            </div>
                        );
                    }
                    else {
                        return (
                            <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                            <EditableNote mode={mode} block={block} uid={block.attrs.uid} makeNotification={makeNotification} post_id={post_id} />
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
