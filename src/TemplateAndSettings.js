import React, {useState, useEffect, useRef} from "react"
import apiClient from './http-common.js';
import {useQuery,useMutation, useQueryClient} from 'react-query';
import { __experimentalNumberControl as NumberControl, TextareaControl, SelectControl, ToggleControl, RadioControl, TextControl } from '@wordpress/components';

export function TemplateAndSettings (props) {
    const {data, makeNotification, user_can} = props;
    const [allowOrganizeAgenda, setAllowOrganizeAgenda] = useState(data.subscribers_can_organize_agenda);
    const [allowEditSignups, setAllowEditsignups] = useState(data.subscribers_can_edit_signups);
    const [newtemplate, setNewTemplate] = useState(0);
    let templates = data.upcoming.map((item) => {if(item.label.indexOf('emplate')) return item});
    templates.push({'value':0,'label':'Choose Template'});

    const queryClient = useQueryClient();

    const templateMutation = useMutation(
        async (change) => { return await apiClient.post("json_copy_post", change)},
        {
            /*
            onMutate: async (assignment) => {
                await queryClient.cancelQueries(['blocks-data',post_id]);
                const previousData = queryClient.getQueryData(['blocks-data',post_id]);
                queryClient.setQueryData(['blocks-data',post_id],(oldQueryData) => {
                    //function passed to setQueryData
                    const {blockindex,roleindex} = assignment;
                    const {data} = oldQueryData;
                    const {blocksdata} = data;
                    blocksdata[blockindex].assignments[roleindex] = assignment;
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
            */
            onSuccess: (data, error, variables, context) => {
                console.log('template change success',data);
                console.log('original variables',variables);
                if(data.data.blockdata)
                queryClient.setQueryData(['blocks-data',data.data.post_id],(oldQueryData) => {
                    const newdata = {
                        ...oldQueryData, data: data.data
                    };
                    console.log('optimistic update of template',newdata);
                    return newdata;
                }) 
                queryClient.invalidateQueries(['blocks-data',data.data.post_id]);
                makeNotification('Template update :'+data.data.status);
                //queryClient.setQueryData("blocks-data", data);
                //queryClient.invalidateQueries(['blocks-data',post_id]);
                //makeNotification('Updated assignment',data.data.prompt);
            },
            onError: (err, variables, context) => {
                console.log('mutate template error',err);
                //queryClient.setQueryData("blocks-data", context.previousData);
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
            console.log('mutate template error',err);
            //queryClient.setQueryData("blocks-data", context.previousData);
        },
    }
);

    return (
        <div>
        <h2>Template Options and Settings</h2>
        <>{data.has_template && <div><p><button className="tmform" onClick={() => { let mymutation = {'copyfrom':data.post_id,'copyto':data.has_template,'post_id':data.post_id}; console.log('mymutation',mymutation); templateMutation.mutate(mymutation); makeNotification('Template '+data.has_template+' updated (not really, still a demo).',false,[{'template_prompt':data.has_template}]);} }>Update Template</button></p><p><em>Click to apply changes you have made to this agenda document to the underlying template.</em></p></div>}</>
        <>{data.is_template && <p><a target="_blank" href={'/wp-admin/edit.php?post_type=rsvpmaker&page=rsvpmaker_template_list&t='+post_id}>Create/Update</a></p>}</>
        <SelectControl label="Apply a Different Template" value={newtemplate} options={templates} onChange={(value) => setNewTemplate(value)} />
        <p><button className="tmform" onClick={() => {  makeNotification('Updating ...'); let mymutation = {'copyfrom':newtemplate,'copyto':data.post_id,'post_id':data.post_id}; console.log('mymutation',mymutation); templateMutation.mutate(mymutation); }}>Apply</button> <em>Use a different template, such as one for a contest.</em></p>
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
</div>
    );
}