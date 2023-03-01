import React, {useState, useEffect} from "react"
import { SelectControl, TextControl } from '@wordpress/components';
import { SanitizedHTML } from './SanitizedHTML.js';
import { useEvaluation,initSendEvaluation } from './queries.js';
import { EvaluationProjectChooser } from "./EvaluationProjectChooser.js";
import { EvaluationPrompt } from "./EvaluationPrompt.js";

export default function EvaluationTool(props) {
const {makeNotification,data,evaluate,setEvaluate,scrolltoId,mode} = props;
const {isLoading,isFetching,data:evaldata} = useEvaluation(evaluate.project, onSuccess);

const [path, setPath] = useState('Path Not Set');
const [manual, setManual] = useState((evaluate && evaluate.manual) ? evaluate.manual : '');
const [title, setTitle] = useState((evaluate && evaluate.title) ? evaluate.title : '');
const [name, setName] = useState((evaluate && evaluate.name) ? evaluate.name : '');
const [project, setProject] = useState((evaluate && evaluate.project) ? evaluate.project : '');
const [responses,setResponses] = useState([]);
const [notes,setNotes] = useState([]);
const [form,setForm] = useState({});
const [sent,setSent] = useState('');

const {mutate:sendEvaluation} = initSendEvaluation(data.post_id, setSent,makeNotification);

useEffect(()=>{
    scrolltoId('react-agenda');
},[sent,form]);

function onSuccess(e) {
    setForm({'prompts':e.data.form,'intro':e.data.intro});
}

if(isLoading || isFetching)
    return <p>Loading ...</p>

let assignment_options = [{'value':'','label':'Choose Speaker'},{'value':'guest','label':'Enter Guest Name'}];
if(data.blocksdata)
data.blocksdata.forEach( (block) => {
    if(block.attrs && block.attrs.role && 'Speaker' == block.attrs.role && block.assignments && Array.isArray(block.assignments) ) {
        block.assignments.forEach( (assignment) => {
            if(window.location.href.indexOf('speaker=') > 0) {
                const speakerparam = window.location.href.match(/speaker=([0-9]+)/);
                const speaker_id = (speakerparam && speakerparam[1]) ? speakerparam[1] : '';
                if(assignment.ID != speaker_id)
                    return;
            }
            if(('' != assignment.ID) && ('0' != assignment.ID) && (0 != assignment.ID)) {
                let label = (assignment.project_text) ? ' / '+assignment.project_text : ' / Speech Project Not Set';
                assignment_options.push({'value':JSON.stringify(assignment),'label':assignment.name+label});  
            }
        } )
        if(evaluate.ID > 0)
        assignment_options.push({'value':JSON.stringify(evaluate),'label':evaluate.name});
        if((window.location.href.indexOf('showprev') > 0) || (window.location.href.indexOf('wp4t_evaluations') > 0)) {
            if(Array.isArray(evaldata.data.previous_speeches) && evaldata.data.previous_speeches.length) {
                evaldata.data.previous_speeches.forEach(
                    (speech) => {assignment_options.push({'value':JSON.stringify(speech.value),'label':speech.label})}
                );
                assignment_options = assignment_options.concat(evaldata.data.previous_speeches);    
            }
        }
        if(Array.isArray(block.memberoptions) && block.memberoptions.length)
        block.memberoptions.forEach(
            (member) => {
                if(member.value > 0) {
                    assignment_options.push({'value':JSON.stringify({'ID':member.value,'name':member.label,'project':''}),'label':member.label});
                }
            }
        );
    }
});

function send() {
    const ev = {'evaluate':evaluate,'form':form,'responses':responses,'notes':notes};
    sendEvaluation(ev);
}

let done;
let openslots = [];

return (
    <div className='eval'>
        <h2>Evaluation Tool</h2>
        {sent && <div>   <SanitizedHTML innerHTML={sent} /><p><button onClick={() => {setSent('');setEvaluate({'ID':'','name':'','project':'','manual':'','title':''});setTitle('');}}>Reset</button></p></div>}
        {data.current_user_id && <p>To request an evaluation from another member, send them this link<br /><a href={data.request_evaluation}>{data.request_evaluation}</a><br /></p>}
        <p>To give an evaluation, use the form below. When both the evaluator and the speaker, have user accounts, the completed evaluation will be sent by email and archived on the member dashboard.</p>
        {!name && (!mode || 'evaluation_demo' != mode) && <SelectControl value={JSON.stringify(evaluate)} options={assignment_options} onChange={(value) => {if('guest' == value) {setName('guest'); return;} const newevaluate = JSON.parse(value); setTitle(newevaluate.title); setProject(newevaluate.project); setEvaluate(newevaluate); }  } />}
        {(name || (mode && 'evaluation_demo' == mode)) && <TextControl label="Speaker Name" value={name} onChange={(value) => {if(!value) {setName(' '); return;}; setName(value); setEvaluate((prev) =>{
            prev.ID = value;
            prev.name = value;
            return prev;
        });}} />}
        <EvaluationProjectChooser manual={manual} project={project} title={title} setManual={setManual} setProject={setProject} setTitle={setTitle} setEvaluate={setEvaluate} makeNotification={makeNotification} />
        <SanitizedHTML innerHTML={form.intro} />
        {form.prompts.map((item,index) => {
            if(!(responses[index] || notes[index]))
                openslots.push(index);
            return <div><EvaluationPrompt promptindex={index} response={responses[index]} note={notes[index]} setResponses={setResponses} setNotes={setNotes} item={item} /></div>
        })}
        {openslots.length > 0 && <p><em>{openslots.length} prompts have not been answered</em></p>}
        <p><button className="tmform" onClick={send}>Send</button></p>
    </div>
)
}
