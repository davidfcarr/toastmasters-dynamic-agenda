import React, {useState, useRef} from "react"
import { TextControl } from '@wordpress/components';
import apiClient from './http-common.js';
import {useQuery, useQueryClient} from 'react-query';
import {SelectCtrl} from './Ctrl.js'

export function Inserter(props) {
    const [insert,setInsert] = useState(null);
    const [rolelist,setRolelist] = useState([]);
    const {blockindex, insertBlock, moveBlock, post_id, data, makeNotification} = props;
    //https://delta.local/wp-json/rsvptm/v1/roles_list
    const queryClient = useQueryClient();
    
    const { isLoading, isSuccess, isError, data:roledata, error, refetch } =
    useQuery('rolelist', fetchRoles, { enabled: true, retry: 2, onSuccess, onError });

    if(isError)
        return <p>Error loading Inserter.js roledata</p>

    const blocklist = [{'label':'Select Note or Other Block','value':''},{'label': 'Agenda Note (same week-to-week)','value':'wp4toastmasters/agendanoterich2'},{'label': 'Editable Note (changes week to week)', 'value':'wp4toastmasters/agendaedit'},{'label': 'Signup Note', 'value':'wp4toastmasters/signupnote'},{'label': 'Speaker/Evaluator Table', 'value':'wp4toastmasters/speaker-evaluator'},{'label': 'Track Absences', 'value':'wp4toastmasters/absences'}];    

    function InsertControl() {
        const [custom,setCustom] = useState('');

        return (
        <div className="insert-selects">
            <div><SelectCtrl label="Insert Role" options={rolelist} onChange={(role)=> {if('custom' == role) setCustom('custom'); else if('Speaker' == role) updateInsert('wp4toastmasters/role',{'role':'Speaker','time_allowed':7}); else if('Evaluator' == role) updateInsert('wp4toastmasters/role',{'role':'Evaluator','time_allowed':3}); else updateInsert('wp4toastmasters/role',{'role':role,'time_allowed':0}); }} />
            {custom && <div><TextControl label="Custom Label" value={custom} onChange={setCustom} /> <button className="blockmove" onClick={() => updateInsert('wp4toastmasters/role',{'role':'custom','custom_role':custom,'time_allowed':0})}>Add</button></div>}</div>
            <div><SelectCtrl label="Insert Other" options={blocklist} onChange={(value)=> {updateInsert(value)}} /></div>
        </div>
        )
    }
//        <RadioControl className="radio-inserter radio-mode" selected={insert} label="Insert" onChange={(value)=> updateInsert(value)} options={[{'label': 'Role', 'value':'wp4toastmasters/role'},{'label': 'Agenda Note', 'value':'wp4toastmasters/agendanoterich2'},{'label': 'Editable Note', 'value':'wp4toastmasters/agendaedit'},,{'label': 'Speaker/Evaluator Table', 'value':'wp4toastmasters/speaker-evaluator'},{'label': 'Signup Note', 'value':'wp4toastmasters/signupnote'},{'label': 'Track Absences', 'value':'wp4toastmasters/absences'}]}/></div>}</>
    
    function fetchRoles() {
        return apiClient.get('roles_list');
    }
    function onSuccess(e) {
        setRolelist(e.data);
    }
    function onError(e) {
        console.log('inserter mutate error',e);
    }

    function saveBlock () {
        insertBlock(blockindex,att,insert);
        setInsert('');
    }

    function updateInsert(value,atts = null) {
        if('wp4toastmasters/role' == value) {
            insertBlock(blockindex,atts,value)
            value = '';
        }
        else if('wp4toastmasters/agendaedit' == value)
        {
            insertBlock(blockindex,{'time_allowed':0,'uid':'note'+Date.now(),'editable':'New editable note'},value)
            value = '';
        }
        else if ('wp4toastmasters/agendanoterich2' == value)
            {
                insertBlock(blockindex,{'time_allowed':0,'uid':'note'+Date.now()},value,'<p class="wp-block-wp4toastmasters-agendanoterich2">new agenda note</p>')
                value = '';
            }
        else if ('wp4toastmasters/signupnote' == value)
        {
            insertBlock(blockindex,{'uid':'note'+Date.now()},value,'<p class="wp-block-wp4toastmasters-signupnote">new signup form note</p>')
            value = '';
        }
        else if ('wp4toastmasters/absences' == value)
        {
            insertBlock(blockindex,{'show_on_agenda':'1'},value)
            value = '';
        }
        else {
            insertBlock(blockindex,{},value);
            value = '';
        }
        setInsert(value);
    }

    function minimumTime(time_allowed,role,count) {
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

    return <InsertControl />
}
