import React, {useState, useEffect} from "react"
import { __experimentalNumberControl as NumberControl, SelectControl, ToggleControl, TextControl, RadioControl } from '@wordpress/components';
import apiClient from './http-common.js';
import {useQuery,useMutation, useQueryClient} from 'react-query';

export function Inserter(props) {
    const [insert,setInsert] = useState(null);
    const [att,setAtt] = useState(null);
    const [rolelist,setRolelist] = useState([]);
    const {blockindex, insertBlock} = props;
    //https://delta.local/wp-json/rsvptm/v1/roles_list
    const queryClient = useQueryClient();
    
    const { isLoading, isSuccess, isError, data, error, refetch } =
    useQuery('rolelist', fetchRoles, { enabled: true, retry: 2, onSuccess, onError });
    
    function fetchRoles() {
        return apiClient.get('roles_list');
    }
    function onSuccess(e) {
        console.log('retrieved role list');
        console.log(e);
        setRolelist(e.data);
    }
    function onError(e) {
        console.log(e);
    }

    function saveBlock () {
        insertBlock(blockindex,att,insert);
        setInsert('');
    }

    function updateInsert(value) {
        if('wp4toastmasters/role' == value)
            setAtt({'role':'','count':1,'time_allowed':0,'padding_time':0,'backup':false});
        setInsert(value);
    }

    function minimumTime(time_allowed,role,count) {
        console.log('check minimum time');
        let min;
        if('Speaker' == role) {
            min = count * 7;
            if(time_allowed < min) {
                time_allowed = min;
            }
        }
        else if('Evaluator' == role) {
            min = count * 3;
            if(time_allowed < min) {
                time_allowed = min;
            }
        }
    return time_allowed;
    }

    if('wp4toastmasters/role' == insert) {
        console.log('rolelist');
        console.log(rolelist);
        return (
            <>
            <p><RadioControl className="radio-mode" selected={insert} label="Insert" onChange={(value)=> updateInsert(value)} options={[{'label': 'Role', 'value':'wp4toastmasters/role'},{'label': 'Agenda Note', 'value':'wp4toastmasters/agendanoterich2'},{'label': 'Editable Note', 'value':'wp4toastmasters/agendaedit'}]}/></p>
            <p><SelectControl label="Role" value={att.role} options={rolelist} onChange={(value) => {setAtt( (prev) => { return {...prev,'role':value, 'time_allowed':minimumTime(prev.time_allowed,value,prev.count)} }); }} /></p>
            {'custom' == att.role && <p><TextControl value={att.custom_role}  onChange={(value) => {setAtt( (prev) => { let newatt = {...prev,'custom_role':value}; return newatt; });  }} /></p>}
            <p><NumberControl label="Count" min="1" value={att.count} onChange={(value) => {setAtt( (prev) => { let newatt = {...prev,'count':value, 'time_allowed':minimumTime(prev.time_allowed,prev.role,value)}; return newatt; } ); }} /> <em>How many members can take this role?</em></p>
            <p><NumberControl label="Time Allowed" min="0" value={att.time_allowed} onChange={(value) => {setAtt( (prev) => { let newatt = {...prev,'time_allowed':value}; return newatt; });  }} /></p>
            {('Speaker' == att.role) && <p><NumberControl label="Padding Time" min="0" value={att.padding_time} onChange={(value) => {setAtt( (prev) => { let newatt = {...prev,'padding_time':value}; return newatt; });  }} /> <em>A little extra time for switching and introducing speakers</em></p>}
            <ToggleControl label="Backup"
            help={
                (true == att.backup)
                    ? 'Editing'
                    : 'Viewing'
            }
            checked={ att.backup }
            onChange={ () => {setAtt( (prev) => { return {...prev,'backup': !att.backup}; } ); }} />
            <button onClick={() => {saveBlock()}}>Save</button>
           </>
        )    
    }
    if('wp4toastmasters/agendanoterich2' == insert)
    return (
        <>
        <p><RadioControl className="radio-mode" selected={insert} label="Insert" onChange={(value)=> updateInsert(value)} options={[{'label': 'Role', 'value':'wp4toastmasters/role'},{'label': 'Agenda Note', 'value':'wp4toastmasters/agendanoterich2'},{'label': 'Editable Note', 'value':'wp4toastmasters/agendaedit'}]}/></p>
        <p></p>
       </>
    )
    if('wp4toastmasters/agendaedit' == insert)
    return (
        <>
        <p><RadioControl className="radio-mode" selected={insert} label="Insert" onChange={(value)=> updateInsert(value)} options={[{'label': 'Role', 'value':'wp4toastmasters/role'},{'label': 'Agenda Note', 'value':'wp4toastmasters/agendanoterich2'},{'label': 'Editable Note', 'value':'wp4toastmasters/agendaedit'}]}/></p>
        <p><TextControl label="heading" value=''  /></p>
       </>
    )
    //just the controls
    return (
        <>
        <p><RadioControl className="radio-mode" selected={insert} label="Insert" onChange={(value)=> updateInsert(value)} options={[{'label': 'Role', 'value':'wp4toastmasters/role'},{'label': 'Agenda Note', 'value':'wp4toastmasters/agendanoterich2'},{'label': 'Editable Note', 'value':'wp4toastmasters/agendaedit'}]}/></p>
       </>
    )
}

//<p><RadioControl className="radio-mode" selected={insert} label="Insert" onChange={(value)=> setInsert(value)} options={[{'label': 'Role', 'value':'wp4toastmasters/role'},{'label': 'Agenda Note', 'value':'wp4toastmasters/agendanoterich2'},{'label': 'Editable Note', 'value':'wp4toastmasters/agendaedit'}]}/></p>}