import React, {useState, useEffect, useRef} from "react"
import apiClient from './http-common.js';
import { TextControl, ToggleControl, RadioControl } from '@wordpress/components';
import RoleBlock from "./RoleBlock.js";
import DeleteButton from "./Delete.js";
import {SpeakerTimeCount} from "./SpeakerTimeCount.js";
import {Inserter} from "./Inserter.js";
import {SanitizedHTML} from "./SanitizedHTML.js";
import {EditorAgendaNote} from './EditorAgendaNote.js';
import {SignupNote} from './SignupNote.js';
import {EditableNote} from './EditableNote.js';
import {Up, Down, DownUp} from './icons.js';
import {updateAgenda} from './queries.js';
import {SelectCtrl, NumberCtrl} from './Ctrl.js'

export default function Reorganize(props) {
    const {data, mode,post_id, makeNotification, ModeControl,showDetails, setMode, setScrollTo, setEvaluate, setPostId} = props;
    const [sync,setSync] = useState(true);
    const [editThis,setEditThis] = useState(-1);
    const {mutate:agendaMutate} = updateAgenda(post_id, makeNotification,Inserter);
    if('reorganize' != mode)
        return null;
        
    function calcTimeAllowed(attrs) {
        let time_allowed = 0;
        let count = (attrs.count) ? attrs.count : 1;
        if('Speaker' == attrs.role)
            time_allowed = count * 7;
        if('Evaluator' == attrs.role)
            time_allowed = count * 3;
        return time_allowed;
    }
  
    function getMoveAbleBlocks () {
        let moveableBlocks = [];
        if(data.blocksdata && Array.isArray(data.blocksdata))
        data.blocksdata.map((block, blockindex) => {
            moveableBlocks.push(blockindex);
        })
        return moveableBlocks;
    }

    function moveBlock(blockindex, direction = 'up') {
        if((blockindex == 0) && (direction == 'up'))
            return; // ignore
        let moveableBlocks = getMoveAbleBlocks();
        let newposition = parseInt(direction);//in case it's a number
        let foundindex = moveableBlocks.indexOf(blockindex);
        if(direction == 'up')
            newposition = moveableBlocks[foundindex - 1];
        else if(direction == 'down')
            newposition = moveableBlocks[foundindex + 2];
        if(direction == 'delete') {
            data.blocksdata.splice(blockindex,1);
        }
        else {
            let currentblock = data.blocksdata[blockindex];
            data.blocksdata[blockindex] = {'blockName':null};
            data.blocksdata.splice(newposition,0,currentblock);
        }
        
        data.changed = 'blocks';
        agendaMutate(data);
    }

    function insertBlock(blockindex, attributes={}, blockname = 'wp4toastmasters/role',innerHTML='', edithtml='') {
        let newblocks = [];
        if(Array.isArray(data.blocksdata))
        data.blocksdata.forEach(
            (block, index) => {
                newblocks.push(block);
                if(index == blockindex) {
                    newblocks.push({'blockName': blockname, 'assignments': [], 'attrs': attributes,'innerHTML':innerHTML,'edithtml':edithtml});
                }
            }
        );
        data.blocksdata = newblocks;
        agendaMutate(data);
    }

    function replaceBlock(blockindex, newblock) {
        let newblocks = [];
        data.blocksdata.forEach(
            (block, index) => {
                
                if(index == blockindex) {
                    newblocks.push(newblock);
                }
                else {
                    newblocks.push(block);
                }
            }
        );
        data.blocksdata = newblocks;
        agendaMutate(data);
    }

    function makeExcerpt(html) {
        let excerpt =  html.replaceAll(/<[^>]+>/g,' ');
        if(excerpt.length > 25)
        excerpt = excerpt.substring(0,25) + '...';
        return excerpt;
    }

function onDragEnd(result) {
    const items = [];
    if(!result.destination)
        return;
    const source = result.source.index;
    const destination = result.destination.index;
    let myblock = data.blocksdata[source];
    data.blocksdata.forEach((block,index) => {
        if(index == source) {
            console.log('drag skip '+index);
            return;
        }
        //console.log('drag add existing '+index);
        items.push(block);
        if(index == destination) {
            console.log('drag add moved '+index);
            console.log('drag add current block',block);
            console.log('drag add myblock',myblock);
            items.push(myblock);
            myblock = null;
        }
    });
    if(myblock) // something went wrong, add it to the end
        items.push(myblock);
    agendaMutate({...data,blocksdata: items});
}

function selectMove(source,destination) {
    console.log('selectMove '+source+' to '+destination);
    const items = [];
    let myblock = data.blocksdata[source];
    console.log('drag source',source);
    console.log('drag destination',destination);
    if('top' == destination) {
        items.push(myblock);
        myblock = null;
    }
    data.blocksdata.forEach((block,index) => {
        if(index == source) {
            console.log('selectMove skip '+index);
            return;
        }
        items.push(block);
        if(index == destination) {
            console.log('selectMove insert '+index);
            items.push(myblock);
            myblock = null;
        }
    });
    if(myblock) // something went wrong, add it to the end
        items.push(myblock);
    agendaMutate({...data,blocksdata: items});
}

    let date = new Date(data.datetime);
    const dateoptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const localedate = date.toLocaleDateString('en-US',dateoptions);
    let endtime = '';
    if(data.blocksdata && Array.isArray(data.blocksdata))
    data.blocksdata.map((block, blockindex) => {
        data.blocksdata[blockindex].datestring = date.toLocaleTimeString('en-US',{'hour': "2-digit", 'minute': "2-digit",'hour12':true});
        if(block?.attrs?.time_allowed) {
            date.setMilliseconds(date.getMilliseconds() + (parseInt(block.attrs.time_allowed) * 60000) );
            if(block.attrs.padding_time)
                date.setMilliseconds(date.getMilliseconds() + (parseInt(block.attrs.padding_time) * 60000) );
            endtime = date.toLocaleTimeString('en-US',{hour: "2-digit", minute: "2-digit",hour12:true});
            data.blocksdata[blockindex].datestring = data.blocksdata[blockindex].datestring.concat( ' to '+ endtime );
        }});

    const moveableBlocks = getMoveAbleBlocks ();

    const getListStyle = isDraggingOver => ({
      background: isDraggingOver ? "white" : "white",
    });
    
    function syncToEvaluator(blocksdata,count) {
        if(!sync)
            return blocksdata;
        blocksdata.forEach((block,blockindex) => {
            if('Evaluator' == block.attrs.role) {
                blocksdata[blockindex].attrs.count = count;
                blocksdata[blockindex].attrs.time_allowed = count * 3;    
            }
        } );
        return blocksdata;
    }
    
    const blockclass = "block reorgblock";
    let movechoices = [{'label':'Where to?','value':''},{'label':'Move to Top','value':'top'}];
    let label = '';
    let choicesForBlock;
    
    {data.blocksdata&& Array.isArray(data.blocksdata) && data.blocksdata.map((block, blockindex) => {
        if(!block.blockName)
            return null;
        label = 'After: '+block.blockName.replace(/^[^/]+\//,'').replace('agendanoterich2','agenda note');
        if(block.attrs.role)
            label = label.concat(' '+block.attrs.role);
        if(block.attrs.editable)
            label = label.concat(' '+block.attrs.editable);
        if(block.innerHTML)
            label = label.concat(' '+makeExcerpt(block.innerHTML));
        movechoices.push({'value':blockindex,'label':label});
    })}

    return (
        <div className="agendawrapper" id={"agendawrapper"+post_id}>
            <>{('rsvpmaker' != wpt_rest.post_type) && <SelectCtrl label="Choose Event" value={post_id} options={data.upcoming} onChange={(value) => {setPostId(parseInt(value)); makeNotification('Date changed, please wait for the date to change ...'); queryClient.invalidateQueries(['blocks-data',post_id]); refetch();}} />}</>
            <h4>{localedate} {data.is_template && <span>(Template)</span>} </h4>
            {data.has_template && <><p>Use the controls below to add or change roles or make other changes for this specific meeting.</p>{data.permissions.edit_post && <p><a href="#" onClick={ () => {makeNotification('Updating ...'); setPostId(data.has_template);} }>Switch to the <strong>event template</strong></a> if you want to make changes to multiple upcoming meeting agendas.</p>}{!data.permissions.edit_post && <p>You must have editing rights on the website to change the template for all upcoming events.</p>}</>}
            {data.is_template && <p><a target="_blank" href={'/wp-admin/edit.php?post_type=rsvpmaker&page=rsvpmaker_template_list&t='+data.post_id}>Create/Update</a> - copy changes to new and existing events</p>}
            {console.log('data before modecontrol',data)} 
            <ModeControl note={'Based on time allotted, meeting will end at '+endtime} makeNotification={makeNotification} isTemplate={(false !== data.is_template)} post_id={data.post_id} />
            {data.blocksdata && Array.isArray(data.blocksdata) && data.blocksdata.map((block, blockindex) => {
                if(!block.blockName)
                    return null;
                if(('speakers-evaluators' == showDetails) && ('wp4toastmasters/role' != block.blockName || !['Speaker','Evaluator'].includes(block.attrs.role)) ) {
                    return null;
                }
                if(('timed' == showDetails) && !block.attrs.time_allowed ) {
                    return null;
                }
                choicesForBlock = [];
                movechoices.forEach(
                (choice) => {
                    if(choice.value != blockindex)
                        choicesForBlock.push(choice);
                }
                ); 
                  return (
                    <>
                    <div className="reorgdrag">
                    <div className="reorgdragup"><button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }><Up /></button></div>
                    <div className="reorgdragdown"><button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }><Down /></button> </div>
                    <div className="reorganize-drag">
                      <div><strong>{block.datestring}</strong></div>
                      <h2>{block.blockName.replace(/^[^/]+\//,'').replace('agendanoterich2','agenda note')}: {block.attrs.role && <span>{block.attrs.role}</span>} {block.attrs.editable && <span>{block.attrs.editable}</span>} {block.innerHTML && <span>{makeExcerpt(block.innerHTML)}</span>}</h2>
                      </div>
                      {showDetails && 'wp4toastmasters/help' == block.blockName && <p>See the knowledge base article <a href="https://www.wp4toastmasters.com/knowledge-base/organize-agenda-tool/">Organize Agenda Tool</a> for video and written instructions.</p>}
                      {showDetails && 'wp4toastmasters/speaker-evaluator' == block.blockName && <div><p>Displays Speaker-Evaluator Matches in a table on the printable and email versions of the agenda.</p><RadioControl label="Columns" selected={block.attrs?.columns} options={[{'label': '2 columns','value': '2'},{'label': 'Separate columns for Speaker, Path, Project, Title','value': '5'}]} onChange={(value) => {data.blocksdata[blockindex].attrs.columns = value; agendaMutate(data)} } /></div>}
                    {showDetails && 'wp4toastmasters/role' == block.blockName && (<div>
                        {(editThis == blockindex) && <><ToggleControl label="Edit" checked={editThis == blockindex} onChange={() => {if(editThis == blockindex) setEditThis(-1); else setEditThis(blockindex); }} /><RoleBlock makeNotification={makeNotification} showDetails={showDetails} agendadata={data} post_id={post_id} blockindex={blockindex} mode="edit" block={block}  setMode={setMode} setScrollTo={setScrollTo} setEvaluate={setEvaluate} /></>}
                        {(editThis != blockindex) && <><ToggleControl label="Edit" checked={editThis == blockindex} onChange={() => {if(editThis == blockindex) setEditThis(-1); else setEditThis(blockindex); }} />{block.assignments && Array.isArray(block.assignments) && block.assignments.map((a) => <div>{a.name}</div>)}</>}

                            <SpeakerTimeCount block={block}  makeNotification={makeNotification} />
                    <div className="tmflexrow"><div className="tmflex30"><NumberCtrl label="Signup Slots" min="1" value={(block.attrs.count) ? block.attrs.count : 1} onChange={ (value) => { data.blocksdata[blockindex].attrs.count = value; if(['Speaker','Evaluator'].includes(block.attrs.role)) { data.blocksdata[blockindex].attrs.time_allowed = calcTimeAllowed(block.attrs); data.blocksdata = syncToEvaluator(data.blocksdata,value); } agendaMutate(data); }} /></div><div className="tmflex30"><NumberCtrl label="Time Allowed" value={(block.attrs?.time_allowed) ? block.attrs?.time_allowed : calcTimeAllowed(block.attrs)} onChange={ (value) => { data.blocksdata[blockindex].attrs.time_allowed = value; agendaMutate(data); }} /></div> {('Speaker' == block.attrs.role) && <div className="tmflex30"><NumberCtrl label="Padding Time" min="0" value={block.attrs.padding_time} onChange={(value) => {data.blocksdata[blockindex].attrs.padding_time = value; agendaMutate(data);}} /></div>}</div>
                    <TextControl label="Note About Role (optional)" value={block.attrs.agenda_note} onChange={ (value) => { data.blocksdata[blockindex].attrs.agenda_note = value; agendaMutate(data); } } />
                    {('Speaker' == block.attrs.role) && 
                    (<div>
                    <p><em>Padding time is a little extra time for switching between and introducing speakers (not included in the time allowed for speeches).</em></p>
                    <p><ToggleControl label="Sync Number of Speakers and Evaluators"
                    help={
                        (true == sync)
                            ? 'Number of evaluators will automatically changed with number of speakers'
                            : 'Let me manage this manually'
                    }
                    checked={ sync }
                    onChange={ () => {setSync(!sync);}} /></p>
                    </div>)}
            <p><ToggleControl label="Backup"
            help={
                (true == block.attrs.backup)
                    ? 'Editing'
                    : 'Viewing'
            }
            checked={ block.attrs.backup }
            onChange={ () => {data.blocksdata[blockindex].attrs.backup = !block.attrs.backup; agendaMutate(data);}} /></p>
            <SpeakerTimeCount block={block} makeNotification={makeNotification} />
                </div>)}
            {showDetails && 'wp4toastmasters/absences' == block.blockName && (<div>
                <ToggleControl label="Show on Agenda"
            help={
                (true == block.attrs.backup)
                    ? 'Show'
                    : 'Hide'
            }
            checked={ block.attrs.show_on_agenda }
            onChange={ () => {data.blocksdata[blockindex].attrs.show_on_agenda = !block.attrs.show_on_agenda; agendaMutate(data);}} />
            </div>)}
            {showDetails && 'wp4toastmasters/agendaedit' == block.blockName && (
                    <div>
                    {showDetails && (editThis == blockindex) && <div><ToggleControl label="Edit" checked={editThis == blockindex} onChange={() => {if(editThis == blockindex) setEditThis(-1); else setEditThis(blockindex); }} /> <EditableNote makeNotification={makeNotification} mode={mode} block={block} blockindex={blockindex} uid={block.attrs.uid} post_id={post_id} /></div>}
                    {showDetails && (editThis != blockindex) && <div><ToggleControl label="Edit" checked={editThis == blockindex} onChange={() => {if(editThis == blockindex) setEditThis(-1); else setEditThis(blockindex); }} /> <SanitizedHTML innerHTML={block.attrs.edithtml} /></div>}
                    <div className="tmflexrow"><div className="tmflex30"><NumberCtrl label="Time Allowed" value={(block.attrs?.time_allowed) ? block.attrs?.time_allowed : 0} onChange={ (value) => { data.blocksdata[blockindex].attrs.time_allowed = value; agendaMutate(data); }} /></div></div>
                    </div>
                ) }
                {showDetails && 'wp4toastmasters/agendanoterich2' == block.blockName && (
                    <div>
                    {showDetails && (editThis == blockindex) && <><ToggleControl label="Edit" checked={editThis == blockindex} onChange={() => {if(editThis == blockindex) setEditThis(-1); else setEditThis(blockindex); }} /><EditorAgendaNote  makeNotification={makeNotification} blockindex={blockindex} block={block} replaceBlock={replaceBlock} /></>}
                    {showDetails && (editThis != blockindex) && <><ToggleControl label="Edit" checked={editThis == blockindex} onChange={() => {if(editThis == blockindex) setEditThis(-1); else setEditThis(blockindex); }} /><SanitizedHTML innerHTML={block.innerHTML} /></>}
                    <div className="tmflexrow"><div className="tmflex30"><NumberCtrl label="Time Allowed" value={(block.attrs?.time_allowed) ? block.attrs?.time_allowed : 0} onChange={ (value) => { data.blocksdata[blockindex].attrs.time_allowed = value; agendaMutate(data); }} /></div></div>
                    </div>
                ) }
                {showDetails && 'wp4toastmasters/signupnote' == block.blockName && (
                    <div>
                    <SignupNote blockindex={blockindex} block={block} replaceBlock={replaceBlock} />
                    </div>
                ) }
                {showDetails && block.innerHTML && !['wp4toastmasters/signupnote','wp4toastmasters/agendanoterich2'].includes(block.blockname) && <SanitizedHTML innerHTML={block.innerHTML} />}
                <p><SelectCtrl label="Move" options={choicesForBlock} onChange={(value) => selectMove(blockindex,value)} /></p>
                {showDetails && <DeleteButton makeNotification={makeNotification} blockindex={blockindex} moveBlock={moveBlock} post_id={post_id} />}
                </div>
                {showDetails && <Inserter makeNotification={makeNotification} blockindex={blockindex} insertBlock={insertBlock} moveBlock={moveBlock} post_id={post_id} />}
                </>               
                )
            })}
            </div>);
}