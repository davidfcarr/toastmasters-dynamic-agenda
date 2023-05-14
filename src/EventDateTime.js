import React from "react"

export function EventDateTime(props) {
    const {post_id,metadata,metaMutate,makeNotification} = props;
    return (
        <div className="event-schedule">
        <p><a href={metadata['editor_base_url']+post_id+'&tab=basics'} target="_blank">Edit Date, Time, and RSVP settings</a></p>
        <p><a href={metadata['editor_base_url']+post_id} target="_blank">Open Event in WordPress Editor</a></p>
        </div>
    )    
}