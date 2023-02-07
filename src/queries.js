import React, {useState, useEffect, useRef} from "react"
import apiClient from './http-common.js';
import {useQuery,useMutation, useQueryClient} from 'react-query';

const [refetchInterval, setRefetchInterval] = useState(30000);
    
export function getBlocksDate() {
    const queryClient = useQueryClient();
    const { isLoading, isFetching, isSuccess, isError, data:axiosdata, error, refetch} =
    useQuery(['blocks-data',post_id], fetchBlockData, { enabled: true, retry: 2, onSuccess, onError, refetchInterval: refetchInterval });
    function fetchBlockData() {
        return apiClient.get('blocks_data/'+post_id);
    }
    
    if(axiosdata) {
        const {permissions} = axiosdata?.data;
        console.log('permissions',permissions);
    }
}


    function calcTimeAllowed(attrs) {
        let time_allowed = 0;
        let count = (attrs.count) ? attrs.count : 1;
        if('Speaker' == attrs.role)
            time_allowed = count * 7;
        if('Evaluator' == attrs.role)
            time_allowed = count * 3;
        return time_allowed;
    }

    function scrolltoId(id){
        if(!id)
            return;
        var access = document.getElementById(id);
        if(!access)
            {
                console.log('scroll to id could not find element '+id);
                return;
            }
        access.scrollIntoView({behavior: 'smooth'}, true);
    }

    //start from the top
    useEffect( () => {
        scrolltoId('react-agenda');
    },
    [mode]);
    
    const assignmentMutation = useMutation(
            async (assignment) => { return await apiClient.post("json_assignment_post", assignment)},
            {
                onMutate: async (assignment) => {
                    await queryClient.cancelQueries(['blocks-data',post_id]);
                    const previousData = queryClient.getQueryData(['blocks-data',post_id]);
                    queryClient.setQueryData(['blocks-data',post_id],(oldQueryData) => {
                        //function passed to setQueryData
                        const {blockindex,roleindex} = assignment;
                        const {data} = oldQueryData;
                        const {blocksdata} = data;
                        blocksdata[blockindex].assignments[roleindex] = assignment;
                        console.log('new assignments for block',blocksdata[blockindex].assignments);
                        const newdata = {
                            ...oldQueryData, data: {...data,blocksdata: blocksdata}
                        };
                        //console.log('modified query to return',newdata);
                        return newdata;
                    }) 
                    makeNotification('Updating ...');
                    return {previousData}
                },
                onSettled: (data, error, variables, context) => {
                    console.log('onsettled variables', variables);
                    queryClient.invalidateQueries(['blocks-data',post_id]);
                    makeNotification('Updated assignment: '+variables.role,true);
                },
                /*
                onSuccess: (data, error, variables, context) => {
                    console.log('assignment update success',data);
                    queryClient.setQueryData("blocks-data", data);
                    queryClient.invalidateQueries(['blocks-data',post_id]);
                    makeNotification('Updated assignment',data.data.prompt);
                },
                */
                onError: (err, variables, context) => {
                    console.log('mutate assignment error',err);
                    queryClient.setQueryData("blocks-data", context.previousData);
                },
            }
    );

    const multiAssignmentMutation = useMutation(
        async (multi) => { return await apiClient.post("json_multi_assignment_post", multi)},
        {
            onMutate: async (multi) => {
                await queryClient.cancelQueries(['blocks-data',post_id]);
                const previousValue = queryClient.getQueryData(['blocks-data',post_id]);
                queryClient.setQueryData(['blocks-data',post_id],(oldQueryData) => {
                    //function passed to setQueryData
                    const {blockindex} = multi;
                    const {data} = oldQueryData;
                    const {blocksdata} = data;
                    blocksdata[blockindex].assignments = multi.assignments;
                    console.log('new block',blocksdata[blockindex]);
                    const newdata = {
                        ...oldQueryData, data: {...data,blocksdata: blocksdata}
                    };
                    console.log('modified query to return',newdata);
                    return newdata;
                }) 
                makeNotification('Updating ...');
                return {previousValue}
            },
            onSettled: (data, error, variables, context) => {
                console.log('onsettled variables', variables);
                queryClient.invalidateQueries(['blocks-data',post_id]);
                makeNotification('Updated');
            },
            onError: (err, variables, context) => {
                console.log('mutate assignment error');
                console.log(err);
                queryClient.setQueryData("blocks-data", context.previousValue);
              },
            } );
    
    async function updateAgendaPost (agenda) {
        return await apiClient.post('update_agenda', agenda);
    }

    const updateAgenda = useMutation(updateAgendaPost, {
        onMutate: async (agenda) => {
            await queryClient.cancelQueries(['blocks-data',post_id]);
            const previousValue = queryClient.getQueryData(['blocks-data',post_id]);
            queryClient.setQueryData(['blocks-data',post_id],(oldQueryData) => {
                //function passed to setQueryData
                const {data} = oldQueryData;
                const newdata = {
                    ...oldQueryData, data: {...data,blocksdata: agenda.blocksdata}
                };
                console.log('modified query to return',newdata);
                return newdata;
            }) 
            makeNotification('Updating ...');
            if(Inserter.setInsert)
                Inserter.setInsert('');
            return {previousValue}
        },
        onSettled: (data, error, variables, context) => {
            console.log('onsettled variables', variables);
            queryClient.invalidateQueries(['blocks-data',post_id]);
            makeNotification('Updated');
        },
        onError: (err, variables, context) => {
            console.log('mutate assignment error');
            console.log(err);
            queryClient.setQueryData("blocks-data", context.previousValue);
          },
    
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

    function MoveButtons(props) {
        const {blockindex, role} = props;
        return (
            <div className="movebuttons">
            <p>{!!(blockindex > moveableBlocks[0]) && <button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }><Up /> Move {role && role+' Role '}Up</button>} {(blockindex < moveableBlocks[moveableBlocks.length -1]) && <button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }><Down /> Move {role && role+' Role '}Down</button>}</p>
            <div><Inserter blockindex={blockindex} insertBlock={insertBlock} moveBlock={moveBlock} post_id={post_id} makeNotification={makeNotification} /> </div>
            </div>
        );
    }

    function insertBlock(blockindex, attributes={}, blockname = 'wp4toastmasters/role',innerHTML='', edithtml='') {
        let newblocks = [];
        data.blocksdata.forEach(
            (block, index) => {
                newblocks.push(block);
                if(index == blockindex) {
                    console.log('newblock',{'blockName': blockname, 'DnDid':'temp'.Date.now(), 'assignments': [], 'attrs': attributes,'innerHTML':innerHTML,'edithtml':edithtml});
                    newblocks.push({'blockName': blockname, 'assignments': [], 'attrs': attributes,'innerHTML':innerHTML,'edithtml':edithtml});
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

    function updateAssignment (assignment, blockindex = null, start=1, count=1) {
        setUpdating('Updating ...');
        //embed index properties if passed to the function separately
        console.log('assignment received by updateAssignment', assignment);

        if(Array.isArray(assignment))
            {
            assignment = assignment.map((a) => { return {...a, post_id:post_id,count:count} });
            return multiAssignmentMutation.mutate({'assignments':assignment,'blockindex':blockindex,'start':1});// todo start won't always be 1!
            }
        else {
        assignment.post_id = post_id;
        console.log('assignment for mutation',assignment);
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
    setUpdated(new Date());
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
    const modeoptions = (user_can('edit_post') || user_can('organize_agenda')) ? [{'label': 'Sign Up', 'value':'signup'},{'label': 'Edit', 'value':'edit'},{'label': 'Suggest', 'value':'suggest'},{'label': 'Organize', 'value':'reorganize'}] : [{'label': 'Sign Up', 'value':'signup'},{'label': 'Edit', 'value':'edit'},{'label': 'Suggest', 'value':'suggest'}];
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
        return(
            <div className="agendawrapper">
            <ModeControl />
            <TemplateAndSettings user_can={user_can} data={data} makeNotification={makeNotification} />
            </div>
        );
    }

    if('reorganize' == mode)
        return <Reorganize data={data} mode={mode} multiAssignmentMutation={multiAssignmentMutation} updateAgenda={updateAgenda} ModeControl={ModeControl} post_id={post_id} updateAssignment={updateAssignment} makeNotification={makeNotification} setRefetchInterval={setRefetchInterval} />

    return (
        <div className="agendawrapper" id={"agendawrapper"+post_id}>
            <>{('rsvpmaker' != wpt_rest.post_type) && <SelectControl label="Choose Event" value={post_id} options={data.upcoming} onChange={(value) => {setPostId(parseInt(value)); makeNotification('Date changed, please wait for the date to change ...'); queryClient.invalidateQueries(['blocks-data',post_id]); refetch();}} />}</>
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
                    return null;
                if('wp4toastmasters/role' == block.blockName) {
                    block.assignments.forEach( (assignment,roleindex) => {console.log(block.attrs.role +': '+roleindex+' name:'+assignment.name)} );
                    return (
                    <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                    <div><strong>{datestring}</strong></div>
                    <RoleBlock agendadata={data} post_id={post_id} apiClient={apiClient} blockindex={blockindex} mode={mode} attrs={block.attrs} assignments={block.assignments} updateAssignment={updateAssignment} />
                    <SpeakerTimeCount block={block} makeNotification={makeNotification} />
                    </div>
                    )
                }
                if('wp4toastmasters/agendanoterich2' == block.blockName && ('edit' == mode) && (user_can('edit_post') || user_can('organize_agenda')) ) {
                    return (
                    <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                    <div><strong>{datestring}</strong></div>
                    <EditorAgendaNote blockindex={blockindex} block={block} replaceBlock={replaceBlock} />
                    </div>)
                }
                else if('wp4toastmasters/agendanoterich2' == block.blockName) {
                    return (
                    <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                    <div><strong>{datestring}</strong></div>
                    <SanitizedHTML innerHTML={block.innerHTML} />
                    </div>)
                }
                //wp:wp4toastmasters/agendaedit {"editable":"Welcome and Introductions","uid":"editable16181528933590.29714489144034184","time_allowed":"5","inline":true}
                if('wp4toastmasters/agendaedit' == block.blockName) {
                    if('edit' == mode) {
                        if((user_can('edit_post') || user_can('organize_agenda')))
                        return (
                            <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                            <div><strong>{datestring}</strong></div>
                            <EditableNote mode={mode} block={block} blockindex={blockindex} uid={block.attrs.uid} post_id={post_id} makeNotification={makeNotification} />
                            </div>
                        );
                        else
                            return null;
                    }
                    else {
                        return (
                            <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                    <div><strong>{datestring}</strong></div>
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
