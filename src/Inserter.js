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
    const {blockindex, insertBlock, moveBlock, post_id, makeNotification, setRefetchInterval} = props;
    const editorRef = useRef(null);

    //https://delta.local/wp-json/rsvptm/v1/roles_list
    const queryClient = useQueryClient();
    
    const { isLoading, isSuccess, isError, data, error, refetch } =
    useQuery('rolelist', fetchRoles, { enabled: true, retry: 2, onSuccess, onError });
//{!unfurl && <p><button className="blockmove insertbutton" onClick={() => {setUnfurl(true); setRefetchInterval(false);/*setInsert('')*/}}><Plus /> Insert</button></p>}

    function InsertControl() {
        return <>{!(insert || deletemode) && <p><button className="blockmove deletebutton" onClick={() => {setDeleteMode(true);setRefetchInterval(false);}}><Delete /> Delete</button></p>} {deletemode && <p><button className="blockmove" onClick={() => {moveBlock(blockindex, 'delete');setRefetchInterval(15000);}}><Delete /> Confirm Delete</button></p>} {!insert && <div><RadioControl className="radio-inserter radio-mode" selected={insert} label="Insert Below" onChange={(value)=> updateInsert(value)} options={[{'label': 'Role', 'value':'wp4toastmasters/role'},{'label': 'Agenda Note', 'value':'wp4toastmasters/agendanoterich2'},{'label': 'Editable Note', 'value':'wp4toastmasters/agendaedit'},{'label': 'Signup Note', 'value':'wp4toastmasters/signupnote'}]}/></div>}</>
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
        console.log('saveBlock called '+insert);
        insertBlock(blockindex,att,insert);
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
        if('wp4toastmasters/role' == value) {
            setAtt({'role':'','count':1,'time_allowed':0,'padding_time':0,'backup':false});
            setRefetchInterval(false);//don't refetch while using form
        }
        else if('wp4toastmasters/agendaedit' == value)
        {
            insertBlock(blockindex,{'time_allowed':0,'uid':'note'+Date.now(),'editable':'New editable note'},value)
            value = '';
            setUnfurl(false);
        }
        else if ('wp4toastmasters/agendanoterich2' == value)
            {
                insertBlock(blockindex,{'time_allowed':0,'uid':'note'+Date.now()},value,'<p class="wp-block-wp4toastmasters-agendanoterich2">new agenda note</p>')
                value = '';
                setUnfurl(false);
            }
        else if ('wp4toastmasters/signupnote' == value)
        {
            insertBlock(blockindex,{'uid':'note'+Date.now()},value,'<p class="wp-block-wp4toastmasters-signupnote">new signup form note</p>')
            value = '';
            setUnfurl(false);
        }
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
        return (
            <div className="insertroleform">
            <h1>Insert Role Below</h1>
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
           </div>
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
            <p><NumberControl label="Time Allowed" min="0"  value={att.time_allowed}  onChange={(value) => {setAtt( (prev) => { let newatt = {...prev,'time_allowed':value}; return newatt; });  }} /></p>
            <p><button className="blockmove" onClick={() => {console.log('clicked save block agenda note'); saveBlock()}}>Save</button></p>
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
            <p><button className="blockmove" onClick={() => {console.log('clicked save block signup note'); saveBlock();}}>Save</button></p>
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
