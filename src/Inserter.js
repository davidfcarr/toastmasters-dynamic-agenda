import React, {useState, useRef} from "react"
import { __experimentalNumberControl as NumberControl, SelectControl, ToggleControl, TextControl, RadioControl } from '@wordpress/components';
import apiClient from './http-common.js';
import {useQuery,useMutation, useQueryClient} from 'react-query';
import { Editor } from '@tinymce/tinymce-react';
import { EditableNote } from './EditableNote.js';
import {Plus, Delete} from './icons.js';

export function Inserter(props) {
    const [insert,setInsert] = useState(null);
    const [unfurl,setUnfurl] = useState(false);
    const [deletemode,setDeleteMode] = useState(false);
    const [att,setAtt] = useState({'uid':''});
    const [rolelist,setRolelist] = useState([]);
    const {blockindex, insertBlock, moveBlock, post_id, makeNotification} = props;
    const editorRef = useRef(null);

    //https://delta.local/wp-json/rsvptm/v1/roles_list
    const queryClient = useQueryClient();
    
    const { isLoading, isSuccess, isError, data, error, refetch } =
    useQuery('rolelist', fetchRoles, { enabled: true, retry: 2, onSuccess, onError });

    function InsertControl() {
        return <>{!unfurl && <button className="blockmove insertbutton" onClick={() => {setUnfurl(true), setInsert('wp4toastmasters/role')}}><Plus /> Insert</button>}{unfurl && <div><RadioControl className="radio-mode" selected={insert} label="Insert" onChange={(value)=> updateInsert(value)} options={[{'label': 'Role', 'value':'wp4toastmasters/role'},{'label': 'Agenda Note', 'value':'wp4toastmasters/agendanoterich2'},{'label': 'Editable Note', 'value':'wp4toastmasters/agendaedit'},{'label': 'Signup Note', 'value':'wp4toastmasters/signupnote'}]}/></div>} {!(unfurl || deletemode) && <button className="blockmove deletebutton" onClick={() => {setDeleteMode(true)}}><Delete /> Delete</button>} {deletemode && <button className="blockmove" onClick={() => {moveBlock(blockindex, 'delete')}}><Delete /> Confirm Delete</button>}</>
    }
    
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
        if(('wp4toastmasters/agendaedit' == insert)) {
            let content = editorRef?.current?.getContent();
            console.log('submit to editable meta', {'uid':att.uid,'note':content,'post_id':post_id});
            editEditable.mutate({'uid':att.uid,'note':content,'post_id':post_id,'blockindex':blockindex});
        }

        let innerHTML = '';
        if(('wp4toastmasters/agendanoterich2' == insert) || ('wp4toastmasters/signupnote' == insert)) {
            innerHTML = editorRef?.current?.getContent();
            innerHTML = innerHTML.replaceAll('<p>',' ');
            innerHTML = innerHTML.replaceAll('</p>',' ');
            innerHTML = '<p>'+innerHTML+'</p>';
            if('wp4toastmasters/agendanoterich2' == insert) 
                innerHTML = innerHTML.replaceAll('<p>','<p class="wp-block-wp4toastmasters-agendanoterich2">');
            if('wp4toastmasters/signupnote' == insert)
               innerHTML = innerHTML.replaceAll('<p>','<p class="wp-block-wp4toastmasters-signupnote">');
            console.log(innerHTML);
        }

        insertBlock(blockindex,att,insert,innerHTML);
        setInsert('');
    }

    const editEditable = useMutation(
        (edit) => { apiClient.post("editable_note_json", edit)},
        {
          // On failure, roll back to the previous value
          onError: (err, variables, previousValue) => {
            console.log('mutate assignment error');
            console.log(err);
            queryClient.setQueryData("blocks-data", previousValue);
          },
          // After success or failure, refetch the todos query
          onSuccess: () => {
            makeNotification('Updated editable note');
          }
        }
    );
  
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
            <InsertControl />
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
            <p><button className="blockmove" onClick={() => {saveBlock()}}>Save</button></p>
           </>
        )    
    }
    if('wp4toastmasters/agendanoterich2' == insert) {
        return (
            <>
            <InsertControl />
            <Editor
            onInit={(evt, editor) => {setAtt( (prev) => { let newatt = {...prev,'uid':'note'+Date.now()}; return newatt; }); return editorRef.current = editor}}
            initialValue=''
            init={{
              height: 100,
              menubar: false,
              toolbar: 'undo redo | bold italic | removeformat',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }}
          />
            <p><NumberControl label="Time Allowed" min="0" value={att?.time_allowed} onChange={(value) => {setAtt( (prev) => { let newatt = {...prev,'time_allowed':value,'uid':'note'+Date.now()}; return newatt; });  }} /></p>
            <p><button className="blockmove" onClick={() => {saveBlock()}}>Save</button></p>
            <p>This text will appear on the agenda, with a timestamp if Time Allowed is set.</p>
           </>
        )    
    }
    if('wp4toastmasters/signupnote' == insert) {
        return (
            <>
            <InsertControl />
            <Editor
            onInit={(evt, editor) => {setAtt( (prev) => { let newatt = {...prev,'uid':'note'+Date.now()}; return newatt; }); return editorRef.current = editor}}
            initialValue=''
            init={{
              height: 100,
              menubar: false,
              toolbar: 'undo redo | bold italic | removeformat',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }}
          />
            <p><button className="blockmove" onClick={() => {saveBlock()}}>Save</button></p>
            <p>This text will appear on the signup form, and <strong>NOT</strong> on the agenda.</p>
           </>
        )    
    }

/*
<!-- wp:wp4toastmasters/signupnote -->
<p class="wp-block-wp4toastmasters-signupnote"></p>
<!-- /wp:wp4toastmasters/signupnote -->
*/

    if('wp4toastmasters/agendaedit' == insert) {
        return (
            <>
            <InsertControl />
            <EditableNote post_id={post_id} block={{'attrs':{'editable':'', 'uid':Date.now(), 'time_allowed':0, 'edithtml':''}}} mode='organize' makeNotification={makeNotification} insertBlock={insertBlock} blockindex={blockindex} setInsert={setInsert} />
            <p>Entering text is optional and will apply to <em>this specific event.</em> The Editable Note is meant to be used for content that changes from meeting to meeting, such as the meeting theme or word of the day.</p>
           </>
        );    
    }
    //just the controls
    return (
            <InsertControl />
    )
}
