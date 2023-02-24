import React from "react"
import { DateTimePicker, ToggleControl } from '@wordpress/components';

export function EventDateTime(props) {
    const {post_id,metadata,metaMutate,makeNotification} = props;
    console.log('metadata passed to EventDateTime',metadata);
    return (
        <div className="event-schedule">
        <div className="calendar">
        <DateTimePicker label="Event Date and Time" 
        is12Hour={ metadata['is12Hour'] }
            __nextRemoveHelpButton
            __nextRemoveResetButton 
        currentDate={metadata._rsvp_dates} onChange={(value) => {metaMutate({'post_id':post_id,'kv':[{'key':'_rsvp_dates','value':value.replace('T',' ')}]}); makeNotification('new date '+value)} } />
        </div>
        <div className="schedule-details">
        <h3>Meeting End Time</h3>
        <input type="time" value={metadata._rsvp_end_date.replace(/[0-9]{4}-[0-9]{2}-[0-9]{2} /,'')} onChange={(e) => {let value = metadata._rsvp_dates.replace(/[0-9]{2}:[0-9]{2}:[0-9]{2}/,'')+e.target.value; console.log('changed time value',value); metaMutate( {'post_id':post_id,'kv':[{'key':'_rsvp_end_date','value':value}]}); makeNotification('new date '+value)} } />        
        <p><ToggleControl label="Collect RSVPs" checked={metadata['_rsvp_on'] > 0} onChange={() => {let value = ((1 != metadata['_rsvp_on']) && ('1' != metadata['_rsvp_on'])) ? '1' : '0'; metaMutate({'post_id':post_id,'kv':[{'key':'_rsvp_on','value':value}]}); makeNotification('Automatically Add Dates'+' = '+value)} } /></p>
        {metadata['_rsvp_on'] > 0 && <><p><strong>Confirmation Message:</strong><br /> {metadata['confirmation_excerpt']}<br /><a href={metadata['editor_base_url']+metadata['_rsvp_confirm']} target="_blank">Edit</a></p></>}
        <p><a href={metadata['editor_base_url']+metadata['_rsvp_form']} target="_blank">Edit RSVP Form</a></p>
        <p><a href={metadata['editor_base_url']+post_id} target="_blank">Open Event in WordPress Editor</a></p>
        </div>
        </div>
    )    
}