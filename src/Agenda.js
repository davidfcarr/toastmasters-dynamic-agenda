import React, {useState, useEffect, useRef} from "react"
import { SelectControl, ToggleControl, RadioControl } from '@wordpress/components';
import RoleBlock from "./RoleBlock.js";
import {SpeakerTimeCount} from "./SpeakerTimeCount.js";
import {EvaluationTool} from "./EvaluationTool.js";
import {TemplateAndSettings} from "./TemplateAndSettings.js";
import {SanitizedHTML} from "./SanitizedHTML.js";
import {EditorAgendaNote} from './EditorAgendaNote.js';
import {EditableNote} from './EditableNote.js';
import {SignupNote} from './SignupNote.js';
import {Reorganize} from './Reorganize';
import {Absence} from './Absence.js';
import {Hybrid} from './Hybrid.js';
import {useBlocks} from './queries.js';

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
    const [showDetails, setshowDetails] = useState(true);
    const [scrollTo,setScrollTo] = useState('react-agenda');
    const [notification,setNotification] = useState(null);
    const [notificationTimeout,setNotificationTimeout] = useState(null);
    const [evaluate,setEvaluate] = useState({'ID':'','name':'','project':'','manual':'','title':''});

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
            return <div className="next-meeting-prompt">Would you like to sign up for the <a href={data.upcoming[pid +1].permalink+'?newsignup'}>Next meeting?</a></div>
        else
            return null;
    }
    
    const { isLoading, isFetching, isSuccess, isError, data:axiosdata, error, refetch} = useBlocks(post_id);
    useEffect(() => {scrolltoId(scrollTo); if('react-agenda' != scrollTo) setScrollTo('react-agenda'); },[mode])
    
    if(axiosdata) {
        const {permissions} = axiosdata?.data;
        console.log('permissions',permissions);
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
        console.log('scroll to id '+id);
        access.scrollIntoView({behavior: 'smooth'}, true);
    }

function ModeControl() {
    const modeoptions = (user_can('edit_post') || user_can('organize_agenda')) ? [{'label': 'Sign Up', 'value':'signup'},{'label': 'Edit', 'value':'edit'},{'label': 'Suggest', 'value':'suggest'},{'label': 'Evaluation', 'value':'evaluation'},{'label': 'Organize', 'value':'reorganize'}] : [{'label': 'Sign Up', 'value':'signup'},{'label': 'Edit', 'value':'edit'},{'label': 'Suggest', 'value':'suggest'},{'label': 'Evaluation', 'value':'evaluation'}];
    if(user_can('edit_post'))
        modeoptions.push({'label': 'Template/Settings', 'value':'settings'});
    return (
    <div id="fixed-mode-control">
        {notification && <div className="tm-notification tm-notification-success suggestion-notification"> <SanitizedHTML innerHTML={notification.message} /> {notification.prompt && <NextMeetingPrompt />} {notification.otherproperties && notification.otherproperties.map( (property) => {if(property.template_prompt) return <div className="next-meeting-prompt"><a target="_blank" href={'/wp-admin/edit.php?post_type=rsvpmaker&page=rsvpmaker_template_list&t='+property.template_prompt}>Create/Update</a> - copy content to new and existing events</div>} )} {isFetching && <em>Fetching fresh data ...</em>}</div>}
        {['signup','edit','reorganize'].includes(mode) && <div className="showtoggle"><ToggleControl label="Show Details"
            help={
                (true == showDetails)
                    ? 'Notes + Speech Details'
                    : 'Outline View'
            }
            checked={ showDetails }
            onChange={ () => {let newvalue = !showDetails; setshowDetails( newvalue ); }} /></div>}
        <RadioControl className="radio-mode" selected={mode} label="Mode" onChange={(value)=> { setScrollTo('react-agenda');setMode(value); }  } options={modeoptions}/>
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
    let datestring = '';
    if(!post_id)
        setPostId(data.post_id);
    if(!current_user_id)
        setCurrentUserId(data.current_user_id);


    console.log('data for agenda return', data);

    if('settings' == mode)
    {
        return(
            <div className="agendawrapper">
            <ModeControl />
            <TemplateAndSettings makeNotification={makeNotification} setPostId={setPostId} user_can={user_can} data={data} />
            </div>
        );
    }

    if('evaluation' == mode)
    {
        return(
            <div className="agendawrapper">
            <ModeControl />
            <EvaluationTool scrolltoId={scrolltoId} makeNotification={makeNotification} data={data} evaluate={evaluate} setEvaluate={setEvaluate} />
            </div>
        );
    }


    if('reorganize' == mode)
        return <Reorganize makeNotification={makeNotification} showDetails={showDetails} setshowDetails={setshowDetails} data={data} mode={mode} ModeControl={ModeControl} post_id={post_id}  />

    return (
        <div className="agendawrapper" id={"agendawrapper"+post_id}>
            <>{('rsvpmaker' != wpt_rest.post_type) && <SelectControl label="Choose Event" value={post_id} options={data.upcoming} onChange={(value) => {setPostId(parseInt(value)); makeNotification('Date changed, please wait for the date to change ...'); queryClient.invalidateQueries(['blocks-data',post_id]); refetch();}} />}</>
            <h4>{date.toLocaleDateString('en-US',dateoptions)} {data.is_template && <span>(Template)</span>}</h4>
            <ModeControl makeNotification={makeNotification} />
            {!Array.isArray(data.blocksdata) && <p>Error loading agenda blocks array.</p>}
            {Array.isArray(data.blocksdata) && data.blocksdata.map((block, blockindex) => {
                datestring = date.toLocaleTimeString('en-US',{hour: "2-digit", minute: "2-digit",hour12:true});
                if(block?.attrs?.time_allowed) {
                    console.log(block.blockName+' role '+block?.attrs?.role+' blocktime'+date.toLocaleTimeString('en-US',{hour: "2-digit", minute: "2-digit",hour12:true}));
                    console.log('blocktime add '+block.attrs.time_allowed+' minutes');
                    date.setMilliseconds(date.getMilliseconds() + (parseInt(block.attrs.time_allowed) * 60000) );
                    if(block.attrs.padding_time)
                        date.setMilliseconds(date.getMilliseconds() + (parseInt(block.attrs.padding_time) * 60000) );
                    datestring = datestring+' to '+ date.toLocaleTimeString('en-US',{hour: "2-digit", minute: "2-digit",hour12:true});
                }
                if(!block.blockName)
                    return null;
                    if('signup' == mode) {
                        if('wp4toastmasters/role' == block.blockName) {
                            Array.isArray(block.assignments) && block.assignments.forEach( (assignment,roleindex) => {console.log(block.attrs.role +': '+roleindex+' name:'+assignment.name)} );
                            console.log('role block',block);
                            console.log('role block member options',block.memberoptions);
                            return (
                            <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                            <div><strong>{datestring}</strong></div>
                            <RoleBlock  makeNotification={makeNotification} showDetails={showDetails} agendadata={data} post_id={post_id} blockindex={blockindex} mode={mode} block={block}  setMode={setMode} setScrollTo={setScrollTo} setEvaluate={setEvaluate} />
                            <SpeakerTimeCount block={block}  makeNotification={makeNotification} />
                            </div>
                            )
                        }    
                        else if(showDetails && 'wp4toastmasters/agendaedit' == block.blockName) {
                            return (
                                <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                                <div><strong>{datestring}</strong></div>
                                <EditableNote  makeNotification={makeNotification} mode={mode} block={block} blockindex={blockindex} uid={block.attrs.uid} post_id={post_id} />
                                <p><button className="tmsmallbutton" onClick={() => {setScrollTo('block'+blockindex);setMode('edit')}}>Edit</button></p>
                                </div>
                            );
                        }
                        else if(showDetails && 'wp4toastmasters/agendanoterich2' == block.blockName) {
                            return (
                            <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                            <div><strong>{datestring}</strong></div>
                            <SanitizedHTML innerHTML={block.innerHTML} />
                            </div>)
                        }
                        else if (showDetails && 'wp4toastmasters/context' == block.blockName ) {
                            return (<>{ block.innerBlocks.map( (ib) => { return <SanitizedHTML innerHTML={ib.innerHTML} /> } ) }</>);
                        }
                        else if(showDetails && block.innerHTML) {
                            // agenda notes, signup notes and other raw content
                            return (<div key={'block'+blockindex} id={'block'+blockindex} className="block" >
                            <SanitizedHTML innerHTML={block.innerHTML} />
                            </div>);
                        }
                        else if ('wp4toastmasters/absences'==block.blockName) {
                            return <Absence  makeNotification={makeNotification} absences={data.absences} current_user_id={current_user_id} post_id={post_id} mode={mode} />
                        }
                        else if ('wp4toastmasters/hybrid'==block.blockName) {
                            return <Hybrid makeNotification={makeNotification} current_user_id={current_user_id} post_id={post_id} mode={mode} />
                        }
                        else
                            return null;
                    }//end signup blocks
                    else if ('edit' == mode) {
                        if('wp4toastmasters/role' == block.blockName) {
                            block.assignments.forEach( (assignment,roleindex) => {console.log(block.attrs.role +': '+roleindex+' name:'+assignment.name)} );
                            return (
                            <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                            <div><strong>{datestring}</strong></div>
                            <RoleBlock  makeNotification={makeNotification} showDetails={showDetails} agendadata={data} post_id={post_id} blockindex={blockindex} mode={mode} block={block} setEvaluate={setEvaluate} />
                            <SpeakerTimeCount block={block}  makeNotification={makeNotification} />
                            </div>
                            )
                        }
                        else if(showDetails && 'wp4toastmasters/agendaedit' == block.blockName) {
                            return (
                                <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                                <div><strong>{datestring}</strong></div>
                                <EditableNote  makeNotification={makeNotification} mode={mode} block={block} blockindex={blockindex} uid={block.attrs.uid} post_id={post_id} />
                                </div>
                            );
                        }
                        if(showDetails && 'wp4toastmasters/agendanoterich2' == block.blockName && (user_can('edit_post') || user_can('organize_agenda')) ) {
                            return (
                            <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                            <div><strong>{datestring}</strong></div>
                            <EditorAgendaNote  makeNotification={makeNotification} blockindex={blockindex} block={block} />
                            </div>)
                        }
                        else if(showDetails && 'wp4toastmasters/signupnote' == block.blockName && (user_can('edit_post') || user_can('organize_agenda'))) {
                            return (
                            <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                            <div><strong>{datestring}</strong></div>
                            <SignupNote blockindex={blockindex} block={block}  />
                            </div>)
                        }
                        else if ('wp4toastmasters/absences'==block.blockName) {
                            console.log('absences',data.absences);
                            return <Absence  makeNotification={makeNotification} absences={data.absences} current_user_id={current_user_id} mode={mode} post_id={post_id} />
                        }
                        else if ('wp4toastmasters/hybrid'==block.blockName) {
                            return <Hybrid makeNotification={makeNotification} current_user_id={current_user_id} post_id={post_id} mode={mode} />
                        }
                        else
                            return null;
                    }//end edit blocks
                    else if ('suggest' == mode) {
                        if('wp4toastmasters/role' == block.blockName) {
                            block.assignments.forEach( (assignment,roleindex) => {console.log(block.attrs.role +': '+roleindex+' name:'+assignment.name)} );
                            return (
                            <div key={'block'+blockindex} id={'block'+blockindex} className="block">
                            <div><strong>{datestring}</strong></div>
                            <RoleBlock  makeNotification={makeNotification} showDetails={showDetails} agendadata={data} post_id={post_id} blockindex={blockindex} mode={mode} block={block}  />
                            <SpeakerTimeCount block={block} makeNotification={makeNotification} />
                            </div>
                            )
                        }
                        else 
                            return null;
                    }//end suggest blocks
                    else
                        return null;
            })}
        </div>
)}
