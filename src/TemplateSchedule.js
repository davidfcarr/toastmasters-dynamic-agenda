import React from "react"
import { TextControl, ToggleControl, SelectControl } from '@wordpress/components';

export function TemplateSchedule(props) {
    const {post_id,metadata,metaMutate,makeNotification} = props;

    console.log('metadata in template schedule',metadata);
const days = ["_sked_Sunday",
"_sked_Monday",
"_sked_Tuesday",
"_sked_Wednesday",
"_sked_Thursday",
"_sked_Friday",
"_sked_Saturday"]
const frequency = ["_sked_Varies",
"_sked_First",
"_sked_Second",
"_sked_Third",
"_sked_Fourth",
"_sked_Last",
"_sked_Every"];
    return (
        <div>
            <div className="template-schedule">
                <div className="frequency">{
                    frequency.map((k) => {
                        let checked = (metadata[k] > 0);
                        console.log('key '+k,metadata[k]);
                        console.log('key checked',checked);
                        return <ToggleControl label={k.replace('_sked_','')} checked={checked} onChange={(value) => {metaMutate({'post_id':post_id,'kv':[{'key':k,'value':!checked}]}); makeNotification(k.replace('_sked_','')+' = '+value)} } />
                    })
                }</div>
                <div className="days">
                {
                    days.map((k) => {
                        let checked = (metadata[k] > 0);
                        console.log('key '+k,metadata[k]);
                        console.log('key checked',checked);
                        return <ToggleControl label={k.replace('_sked_','')} checked={checked} onChange={() => {metaMutate({'post_id':post_id,'kv':[{'key':k,'value':!checked}]}); makeNotification(k.replace('_sked_','')+' = '+value)} } />
                    })
                }   
                </div>
                <div className="schedule-details">
                    {console.log()}
                <p><strong>Start Time</strong> <input type="time" value={metadata['_sked_hour']+':'+metadata['_sked_minutes']} onChange={(e) => {let split = e.target.value.split(':'); metaMutate({'post_id':post_id,'kv':[{'key':'_sked_hour','value':split[0]},{'key':'_sked_minutes','value':split[1]}]}) }} /></p>
                <SelectControl
			label="Time Display"
			value={metadata['_sked_duration']}
			options={ [
				{ label: 'End Time Not Displayed', value: '' },
				{ label: 'Show End Time', value: 'set' },
				{ label: 'All Day / Time Not Shown', value: 'allday' },
				{ label: '2 Days / Time Not Shown', value: 'multi|2' },
            { label: '3 Days / Time Not Shown', value: 'multi|3' },
            { label: '4 Days / Time Not Shown', value: 'multi|4' },
            { label: '5 Days / Time Not Shown', value: 'multi|5' },
            { label: '6 Days / Time Not Shown', value: 'multi|6' },
            { label: '7 Days / Time Not Shown', value: 'multi|7' },
			] }
			onChange={function( content ) {
				metaMutate( {'post_id':post_id,'kv':[{'key':'_sked_duration','value':content}]} );
			}}
		/> 
                <p><strong>End Time</strong> <input type="time" value={metadata['_sked_end']} onChange={(e) => {let value = e.target.value; metaMutate({'post_id':post_id,'kv':[{'key':'_sked_end','value':value}]}) }} /></p>
                <p><ToggleControl label="Automatically Add Dates" checked={metadata['rsvpautorenew'] > 0} onChange={() => {let value = ((1 != metadata['rsvpautorenew']) && ('1' != metadata['rsvpautorenew'])) ? '1' : '0'; metaMutate({'post_id':post_id,'kv':[{'key':'rsvpautorenew','value':value}]}); makeNotification('Automatically Add Dates'+' = '+value)} } /></p>
                <p><ToggleControl label="Collect RSVPs" checked={metadata['_rsvp_on'] > 0} onChange={() => {let value = ((1 != metadata['_rsvp_on']) && ('1' != metadata['_rsvp_on'])) ? '1' : '0'; metaMutate({'post_id':post_id,'kv':[{'key':'_rsvp_on','value':value}]}); makeNotification('Automatically Add Dates'+' = '+value)} } /></p>
                {metadata['_rsvp_on'] > 0 && <><p><strong>Confirmation Message:</strong><br /> {metadata['confirmation_excerpt']}<br /><a href={metadata['editor_base_url']+metadata['_rsvp_confirm']} target="_blank">Edit</a></p></>}
                <p><a href={metadata['editor_base_url']+metadata['_rsvp_form']} target="_blank">Edit RSVP Form</a></p>
                <p><a href={metadata['editor_base_url']+post_id} target="_blank">Open Event Template in WordPress Editor</a></p>
                </div>
            </div>
        </div>
    )    
}