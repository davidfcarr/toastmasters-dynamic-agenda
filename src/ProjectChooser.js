import React, {useState, useEffect, useRef} from "react"
import { SelectControl, TextControl } from '@wordpress/components';
import { Editor } from '@tinymce/tinymce-react';

export default function ProjectChooser(props) {
    const [choices, setChoices] = useState([]);
    const [path, setPath] = useState('Path Not Set');
    const [manual, setManual] = useState(props.manual);
    const [project, setProject] = useState((props.project) ? props.project : '');
    const [title, setTitle] = useState(props.title);
    const [display_time, setDisplayTime] = useState(props.display_time);
    const [maxtime, setMaxTime] = useState(props.maxtime);
    const editorRef = useRef(null);

    useEffect( () => {
        fetch(wpt_rest.url + 'rsvptm/v1/paths_and_projects', {headers: {'X-WP-Nonce': wpt_rest.nonce}})
        .then((response) => response.json())
        .then((data) => {
            if(data.paths) {
                setChoices(data);
            } 
        });

        if(props.project)
        {
            startFromProject(props.project);
        }
    },[]);

    function startFromProject(project) {
        let manual = project.replace(/([\s0-9]+)$/,'');
        let path = manual.replace(/ Level.+/,'');
        setPath(path);
        if(!props.manual && manual)
            setManual(manual);
    }

    function projectTime(project) {
        let value = (typeof choices['maxtime'][project] == 'undefined') ? '7' : choices['maxtime'][project];
        setMaxTime(value);
        value = (typeof choices['display_time'][project] == 'undefined') ? '5 - 7 minutes' : choices['display_time'][project];
        setDisplayTime(value);
    }

    function updateSpeech() {
        console.log(props);
        console.log('update speech for '+props.assignment.ID);
        props.updateAssignment({'role': 'Speaker', 'ID': props.assignment.ID,'roleindex':props.roleindex,'blockindex':props.blockindex,'manual':manual,'project':project,'title':title,'intro':editorRef.current.getContent(),'start':props.attrs.start});
    }
    
    if(!choices || typeof choices.manuals == 'undefined')
        return <p>Loading project choices</p>
    return (
        <>
        <div><SelectControl options={choices['paths']} value={path} label="Path" onChange={(value) => setPath(value)} /></div>
        <div><SelectControl options={choices['manuals'][path]} value={manual} label="Level" onChange={(value) => {setManual(value)}} /></div>
        <div>Project select goes here <SelectControl options={(choices['projects'][manual]) ? choices['projects'][manual] : [{'value':'',label:'Set Path and Level to See Projects'}] } value={project} label="Project" onChange={(value) => { setProject(value); projectTime(value); } } /></div>
        <p>project {typeof project}</p>
        <div className="tmflexrow">
        <div className="tmflex50">
        <TextControl label="Display Time" onChange={(value) => { setDisplayTime(value) } } value={display_time} />
        </div>
        <div className="tmflex50">
        <TextControl label="Maximum Time Allowed" onChange={(value) => { setMaxTime(value) }} value={maxtime} />
        </div>
        </div>
        <p><strong>Title</strong> <TextControl value={title} onChange={(value) => setTitle(value)} /></p>
        <p><strong>Intro</strong> 
        <Editor
        onInit={(evt, editor) => editorRef.current = editor}
        initialValue={props.intro}
        init={{
          height: 100,
          menubar: false,
          toolbar: 'undo redo | bold italic | removeformat',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
        }}
      />        
        </p>
        <p><button className="tmform" onClick={updateSpeech}>Save</button></p>
        </>
    )
}
