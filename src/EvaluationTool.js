import React, {useState, useEffect} from "react"
import { TextControl } from '@wordpress/components';
import {SelectCtrl} from './Ctrl.js'
import { SanitizedHTML } from './SanitizedHTML.js';
import { useEvaluation,initSendEvaluation } from './queries.js';
import { EvaluationProjectChooser } from "./EvaluationProjectChooser.js";
import { EvaluationPrompt } from "./EvaluationPrompt.js";
import {Yoodli} from './icons.js'
import clipboard from 'clipboardy';
import { isError } from "react-query";

export default function EvaluationTool(props) {
const {makeNotification,data,evaluate,setEvaluate,scrolltoId,mode} = props;
const {isLoading,isError,isFetching,data:evaldata} = useEvaluation(evaluate.project, evaluate.ID, onSuccess);
if(isError)
    return <p>Error loading evaluation data</p>
const [path, setPath] = useState('Path Not Set');
const [manual, setManual] = useState((evaluate && evaluate.manual) ? evaluate.manual : '');
const [title, setTitle] = useState((evaluate && evaluate.title) ? evaluate.title : '');
const [name, setName] = useState((evaluate && evaluate.name) ? evaluate.name : '');
const [evaluatorName, setEvaluatorName] = useState(data.current_user_name);
const [evaluatorEmail, setEvaluatorEmail] = useState();
const [project, setProject] = useState((evaluate && evaluate.project) ? evaluate.project : '');
const [responses,setResponses] = useState([]);
const [notes,setNotes] = useState([]);
const [form,setForm] = useState({});
const [sent,setSent] = useState('');
const [secondLanguagePrompt,setSecondLanguagePrompt] = useState('');

let query = ((window.location.href.indexOf('?') == -1)) ? '?mode=evaluation' : '&mode=evaluation' ;
let resetLink = ((window.location.href.indexOf('mode') == -1)) ? window.location.href + query : window.location.href;

const {mutate:sendEvaluation} = initSendEvaluation(data.post_id, setSent,makeNotification);

useEffect(()=>{
    scrolltoId('react-agenda');
},[sent,form]);

function onSuccess(e) {
    if(e.data.second_language_requested > 0)
        {
        console.log('adding second language prompts',e.data);
        setForm({'prompts':e.data.form.concat(e.data.second_language),'intro':e.data.intro,'second_language_requested':true});
        }
    else {
        console.log('no second language prompts',e.data);
        setForm({'prompts':e.data.form,'intro':e.data.intro,'second_language_requested':false,'second_language':e.data.second_language});
    }
}

if(isLoading || isFetching)
    return <p>Loading ...</p>

let assignment_options = [{'value':'','label':'Choose Speaker'},{'value':'guest','label':'Enter Guest Name'}];
console.log('evaluation dashboard data',data.blocksdata);
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

if(assignment_options.length < 4)
data.allmembers.forEach( (opt) => {assignment_options.push(opt)} );

console.log('evaluation assignment options',assignment_options);

function send() {
    const ev = {'evaluate':evaluate,'form':form,'responses':responses,'notes':notes,'evaluator_name':evaluatorName,'evaluator_email':evaluatorEmail};
    sendEvaluation(ev);
    makeNotification('Saving ...');
}

let openslots = [];

function copyEvaluation() {
    const blobInput = new Blob([sent], {type: 'text/html'});
	const clipboardItemInput = new ClipboardItem({'text/html' : blobInput});
	navigator.clipboard.write([clipboardItemInput]);
}

console.log('evaluation tool mode',mode);

return (
    <div className='eval'>
        <h2>Evaluation Tool</h2>
        {sent && (<div><p><button onClick={copyEvaluation}>Copy to Clipboard</button> <em>works in most browsers, but not Firefox</em></p> <p><a href={resetLink}>Reset</a></p>  <SanitizedHTML innerHTML={sent} /><p><a href={resetLink}>Reset</a></p></div>)}
        <h3>Get Feedback</h3>
        {data.current_user_id && <p>To request an evaluation, share this link<br /><a href={data.request_evaluation}>{data.request_evaluation}</a> {data.request_evaluation.indexOf('admin') > 0 && <span>(login required)</span>}<br /></p>}
        {data.current_user_id == false && <p>Toastmost users can request an evaluation from a fellow Toastmaster using this system.</p>}
        <div id="YoodliPromo"><Yoodli /></div>
        <h3>Give Feedback</h3>
        <p>To give an evaluation, use the form below. When both the evaluator and the speaker have user accounts, the completed evaluation will be sent by email and archived on the member dashboard.</p>
        {!name && (!mode || 'evaluation_demo' != mode) && <SelectCtrl source="Member or Guest" value={JSON.stringify(evaluate)} options={assignment_options} onChange={(value) => {if('guest' == value) {setName('guest'); return;} const newevaluate = JSON.parse(value); setTitle(newevaluate.title); setProject(newevaluate.project); setEvaluate(newevaluate); }  } />}
        {(name || (mode && 'evaluation_demo' == mode)) && <TextControl label="Speaker Name" value={name} onChange={(value) => {if(!value) {setName(' '); return;}; setName(value); setEvaluate((prev) =>{
            prev.ID = value;
            prev.name = value;
            return prev;
        });}} />}
        {!data.current_user_name && <TextControl label="Evaluator Name" value={evaluatorName} onChange={(value) => {setEvaluatorName(value)} } />}
        {(('evaluation_guest' == mode) && !data.is_user_logged_in) && <TextControl label="Evaluator Email" value={evaluatorEmail} onChange={(value) => {setEvaluatorEmail(value)} } />}
        <EvaluationProjectChooser manual={manual} project={project} title={title} setManual={setManual} setProject={setProject} setTitle={setTitle} setEvaluate={setEvaluate} makeNotification={makeNotification} />
        <SanitizedHTML innerHTML={form.intro} />
        {form.prompts.map((item,index) => {
            if(!(responses[index] || notes[index]))
                openslots.push(index);
            return <div><EvaluationPrompt promptindex={index} response={responses[index]} note={notes[index]} setResponses={setResponses} setNotes={setNotes} item={item} /></div>
        })}
        {secondLanguagePrompt && form.second_language.map((item,slindex) => {
            let index = slindex + form.prompts.length;
            if(!(responses[index] || notes[index]))
                openslots.push(index);
            return <div><EvaluationPrompt promptindex={index} response={responses[index]} note={notes[index]} setResponses={setResponses} setNotes={setNotes} item={item} /></div>
        })}
        {openslots.length > 0 && <p><em>{openslots.length} prompts have not been answered</em></p>}
        {form.second_language_requested && <p><em>The last four speaking-in-a-second-language prompts were requested by the speaker.</em></p>}
        {!form.second_language_requested && !secondLanguagePrompt && <p><input type="checkbox" onClick={() => {setSecondLanguagePrompt(true); }} /> Add prompts for those speaking in a second language</p>}
        <p><button className="tmform" onClick={send}>Send</button></p>
    </div>
)
}
