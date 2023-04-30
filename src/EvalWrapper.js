import React, {useState, useEffect} from "react"
import EvaluationTool from "./EvaluationTool.js";
import {useBlocks} from './queries.js';
import { SanitizedHTML } from './SanitizedHTML.js';

export function EvalWrapper(props) {
    let initialPost = 0;
    const [post_id, setPostId] = useState(initialPost);
    const [current_user_id,setCurrentUserId] = useState(0);
    const mode = props.mode_init;
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
    
    function scrolltoId(id){
        if(!id)
            return;
        var access = document.getElementById(id);
        if(!access)
            {
                return;
            }
        access.scrollIntoView({behavior: 'smooth'}, true);
    }

function ModeControl() {
    const modestyle = ('evaluation_admin' == mode) ? {'marginLeft':'200px;'} : {};
    return (
    <div id="fixed-mode-control" style={modestyle}>
        {notification && <div className="tm-notification tm-notification-success suggestion-notification"> <SanitizedHTML innerHTML={notification.message} /> {notification.prompt && <NextMeetingPrompt />} {notification.otherproperties && notification.otherproperties.map( (property) => {if(property.template_prompt) return <div className="next-meeting-prompt"><a target="_blank" href={'/wp-admin/edit.php?post_type=rsvpmaker&page=rsvpmaker_template_list&t='+property.template_prompt}>Create/Update</a> - copy content to new and existing events</div>} )} {isFetching && <em>Fetching fresh data ...</em>}</div>}
        {'evaluation_demo' == mode && <p style={{"textAlign":"center"}}>This tool works even better as part of a <a href="https://toastmost.org">Toastmost.org</a> website! <a href="https://toastmost.org">Learn more</a></p>}
    </div>)
}


const { isLoading, isFetching, isSuccess, isError, data:axiosdata, error, refetch} = useBlocks(post_id);
if(isError)
    return <p>Error loading evaluation data (EvalWrapper)</p>
if(isLoading)
    return <div>Loading ...</div>
    const data = axiosdata.data;
    
/*if dashboard version, lookup user id
    if(!current_user_id)
        setCurrentUserId(data.current_user_id);
    */
        return(
            <div className="agendawrapper">
            <ModeControl />
            <EvaluationTool mode={mode} scrolltoId={scrolltoId} makeNotification={makeNotification} data={data} evaluate={evaluate} setEvaluate={setEvaluate} /> 
            </div>
        );
}
