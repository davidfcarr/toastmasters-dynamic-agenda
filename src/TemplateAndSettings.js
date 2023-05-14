import React, {useState, useEffect, useRef} from "react"
import apiClient from './http-common.js';
import {useMutation, useQueryClient} from 'react-query';
import { ToggleControl } from '@wordpress/components';
import {SelectCtrl} from './Ctrl.js'
import {EventDateTime} from './EventDateTime.js';
import {TemplateSchedule} from './TemplateSchedule.js';
import { rsvpMetaData, initRSVPMetaMutate } from "./rsvpmaker-api.js";

export function TemplateAndSettings (props) {
    const {data, user_can, setPostId, makeNotification} = props;
    const [allowOrganizeAgenda, setAllowOrganizeAgenda] = useState(data.subscribers_can_organize_agenda);
    const [allowEditSignups, setAllowEditsignups] = useState(data.subscribers_can_edit_signups);
    const [newSignupDefault, setNewSignupDefault] = useState(data.newSignupDefault);
    const [templateToEdit, setTemplateToEdit] = useState(data.is_template ? data.post_id: data.has_template);
    const [newtemplate, setNewTemplate] = useState(0);

    const {data:mdata,isLoading:metaIsLoading,isError:metaIsError} = rsvpMetaData(data.post_id);
    if(metaIsError)
        return <p>Error loading event metadata</p>
    if(metaIsLoading) 
        console.log('metadata is loading');
    else if (!mdata.data) {
        makeNotification('error loading event metadata');
        const metadata = null;
    }
    else {
        const metadata = mdata.data;
        console.log('metadata',metadata);
    }
    const {mutate:metaMutate} = initRSVPMetaMutate(data.post_id,makeNotification);

    let templates = data.upcoming.filter((item) => {if(item.label.indexOf('emplate') > 0) { return true }});
    templates.push({'value':0,'label':'Choose Template'});

    function currentlyEditing() {
        let response = 'an event without a template';
        if(data.has_template)
            response = 'an event based on a template';
        else if (data.is_template)
            response = 'a template';
        return response;
    }

    const queryClient = useQueryClient();

    const templateMutation = useMutation(
        async (change) => { return await apiClient.post("json_copy_post", change)},
        {
            onSuccess: (data, error, variables, context) => {
                if(data.data.blockdata)
                queryClient.setQueryData(['blocks-data',data.data.post_id],(oldQueryData) => {
                    const newdata = {
                        ...oldQueryData, data: data.data
                    };
                    return newdata;
                }) 
                queryClient.invalidateQueries(['blocks-data',data.data.post_id]);
            },
            onError: (err, variables, context) => {
                console.log('mutate template error',err);
                makeNotification('Error '+err.message);
            },
        }
);

const permissionsMutation = useMutation(
    async (change) => { return await apiClient.post("json_agenda_permissions", change)},
    {
        onSuccess: (data, error, variables, context) => {
            console.log('permissions update',data);
            makeNotification('Permissions update: '+data.data.status);
        },
        onError: (err, variables, context) => {
            makeNotification('Error '+err.message);
            console.log('mutate template error',err);
        },
    }
);

const loading_icon = document.getElementById('loading-icon');
if(loading_icon)
    loading_icon.style = 'display: none';

    return (
        <div>
        <h2>Template Options and Settings</h2>
        <p>Currently editing <em>{currentlyEditing()}</em></p>
        <SelectCtrl label="Edit Template" value={templateToEdit} options={templates} onChange={(value) => setTemplateToEdit(parseInt(value))} />
        <p><button className="tmform" onClick={() => { makeNotification('Updating ...'); setPostId(templateToEdit);}}>Edit</button></p>
        <>{data.has_template && <div><p><button className="tmform" onClick={() => { let mymutation = {'copyfrom':data.post_id,'copyto':data.has_template,'post_id':data.post_id}; templateMutation.mutate(mymutation); makeNotification('Template '+data.has_template+' updated.',false,[{'template_prompt':data.has_template}]);} }>Update Template</button></p><p><em>Click to apply changes you have made to this agenda document to the underlying template.</em></p></div>}</>
        <>{data.is_template && <p><a target="_blank" href={'/wp-admin/edit.php?post_type=rsvpmaker&page=rsvpmaker_template_list&t='+data.post_id}>Create/Update</a> - copy content to new and existing events</p>}</>
        <>{data.has_template && (<><SelectCtrl label="Apply a Different Template" value={newtemplate} options={templates} onChange={(value) => setNewTemplate(value)} />
        <p><button className="tmform" onClick={() => {  makeNotification('Updating ...'); let mymutation = {'copyfrom':newtemplate,'copyto':data.post_id,'post_id':data.post_id}; templateMutation.mutate(mymutation); }}>Apply</button> <em>Use a different template, such as one for a contest.</em></p>
        </>)}</>
        
        <>{user_can('manage_options') && (
        <div className="adminonly"><h3>Administrator Only Options</h3>
        <ToggleControl label="All Members Can Edit Signups"
            help={
                (true == allowEditSignups)
                    ? 'Allowed'
                    : 'Prohibited'
            }
            checked={ allowEditSignups }
            onChange={ () => {let newvalue = !allowEditSignups; setAllowEditsignups( newvalue ); permissionsMutation.mutate({'key':'edit_signups','value':newvalue}); }} />
        <ToggleControl label="All Members Can Organize Agenda"
            help={
                (true == allowOrganizeAgenda)
                    ? 'Allowed'
                    : 'Prohibited'
            }
            checked={ allowOrganizeAgenda }
            onChange={ () => {let newvalue = !allowOrganizeAgenda; setAllowOrganizeAgenda( newvalue ); permissionsMutation.mutate({'key':'organize_agenda','value':newvalue}); }} />
        
        <p><em>You can decide whether in addition to signing up for roles, members are able to edit assignments for others or insert/delete/move roles and content blocks on the agenda.</em></p></div>)}</>
        {!data.is_template && <p><a href={data.editor+'&tab=basics'} target="_blank">Edit Date, Time, and RSVP settings</a></p>}
        {data.is_template && <p><a href={data.editor+'&tab=basics'} target="_blank">Edit Template Schedule and RSVP settings</a></p>}
        <p><a href={data.editor} target="_blank">Open in WordPress Editor</a></p>
</div>
    );
}