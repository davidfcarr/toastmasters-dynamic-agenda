import React, {useState, useEffect, Suspense} from "react"
import { RadioControl } from '@wordpress/components';
import {SelectCtrl} from './Ctrl.js'
import {TemplateAndSettings} from "./TemplateAndSettings.js";
import Reorganize from './Reorganize';
import {SanitizedHTML} from './SanitizedHTML';
import {useBlocks} from './queries.js';

export default function Agenda(props) {
    let initialPost = 0;
    const [post_id, setPostId] = useState(initialPost);
    const [current_user_id,setCurrentUserId] = useState(0);
    const [mode, setMode] = useState('settings');
    const [showDetails, setshowDetails] = useState('all');
    const [scrollTo,setScrollTo] = useState('react-agenda');
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
            return <div className="next-meeting-prompt">Would you like to sign up for the <a href={data.upcoming[pid +1].permalink+'?newsignup'}>Next meeting?</a></div>
        else
            return null;
    }
    
    const { isLoading, isFetching, isSuccess, isError, data:axiosdata, error, refetch} = useBlocks(post_id, mode,true);
    if(isError)
        return <p>Error loading ReorgWrapper.js data</p>

    useEffect(() => {scrolltoId(scrollTo); if('react-agenda' != scrollTo) setScrollTo('react-agenda'); },[mode])
    
    if(axiosdata?.data) {
        const data = axiosdata.data;
        if(data.has_template)
            setPostId(data.has_template);
        const {permissions} = axiosdata.data;
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

function ModeControl(props) {
    const {note} = props;
    const modeoptions = [{'label': 'Template/Settings', 'value':'settings'},{'label': 'Organize', 'value':'reorganize'},{'label': 'Preview Agenda', 'value':'preview-agenda'}];
    const viewoptions = ('reorganize' == mode) ? [{'value':'all','label':'Show All'},{'value':'','label':'Outline View'},{'value':'speakers-evaluators','label':'Speakers and Evaluators Only'},{'value':'timed','label':'Timed Elements Only'}] : [{'value':'all','label':'Show Details'},{'value':'','label':'Outline View'},{'value':'speakers-evaluators','label':'Speakers and Evaluators Only'}];
    return (
    <div id="fixed-mode-control">
        {note && <p className="modenote">{note}</p>}
        {notification && <div className="tm-notification tm-notification-success suggestion-notification"> <SanitizedHTML innerHTML={notification.message} /> {notification.prompt && <NextMeetingPrompt />} {notification.otherproperties && notification.otherproperties.map( (property) => {if(property.template_prompt) return <div className="next-meeting-prompt"><a target="_blank" href={'/wp-admin/edit.php?post_type=rsvpmaker&page=rsvpmaker_template_list&t='+property.template_prompt}>Create/Update</a> - copy content to new and existing events</div>} )} {isFetching && <em>Fetching fresh data ...</em>}</div>}
        {['signup','edit','reorganize'].includes(mode) && <div className="showtoggle"><SelectCtrl label="View Options"
            options={viewoptions}
            value={ showDetails }
            onChange={ (newvalue) => { console.log('setshowDetails',newvalue); setshowDetails( newvalue ); }} /></div>}
        <RadioControl className="radio-mode" selected={mode} label="Mode" onChange={(value)=> { setScrollTo('react-agenda');setMode(value); }  } options={modeoptions}/>
        <p className="mode-help">{getHelpMessage()}</p>
        </div>)
}

function getHelpMessage() {
    if('signup' == mode)
    return 'Sign yourself up for roles and enter/update speech details';
if('edit' == mode)
    return 'Assign others to roles and edit their speech details. Rearrange or delete assignments.';
if('suggest' == mode)
    return 'Nominate another member for a role -- they will get an email notification that makes it easy to say yes';
if('evaluation' == mode)
    return 'Provide written speech feedback using digital versions of the evaluation forms';
if('reorganize' == mode)
    return 'Rearrange roles and other elements on your agenda and adjust the timing';
if('settings' == mode)
    return 'Update your standard meeting template or switch the template for the current meeting. Adjust event date and time. Update settings.';
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

    const data = axiosdata.data;
    if(!post_id)
        setPostId(data.post_id);
    if(!current_user_id)
        setCurrentUserId(data.current_user_id);

    if('settings' == mode)
    {
        return(
            <div className="agendawrapper">
            <TemplateAndSettings makeNotification={makeNotification} setPostId={setPostId} user_can={user_can} data={data} />
            <ModeControl />
            </div>
        );
    }

    if('reorganize' == mode)
        return (<div>
            <Reorganize data={data} mode={mode} setMode={setMode} post_id={post_id} makeNotification={makeNotification} ModeControl={ModeControl} showDetails={showDetails} setshowDetails={setshowDetails} setScrollTo={setScrollTo} />
            </div>)
    else
        return (
        <div className="agenda-preview">
            <p><em>Showing preview with ficticious date and members</em></p>
            <iframe src={data.agenda_preview} width="800" height="2000" ></iframe><ModeControl />
            </div>
        )
}
