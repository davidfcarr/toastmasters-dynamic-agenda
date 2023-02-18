import React, {useState, useEffect, useRef} from "react"
import apiClient from './http-common.js';
import { __experimentalNumberControl as NumberControl, TextareaControl, SelectControl, ToggleControl, RadioControl, TextControl } from '@wordpress/components';
import RoleBlock from "./RoleBlock.js";
import {SpeakerTimeCount} from "./SpeakerTimeCount.js";
import {Inserter} from "./Inserter.js";
import {SanitizedHTML} from "./SanitizedHTML.js";
import {EditorAgendaNote} from './EditorAgendaNote.js';
import {SignupNote} from './SignupNote.js';
import {EditableNote} from './EditableNote.js';
import {Up, Down} from './icons.js';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export function Reorganize(props) {
    const {data, mode, multiAssignmentMutation,updateAgenda,ModeControl,post_id,updateAssignment,makeNotification,setRefetchInterval, showDetails} = props;
    const [sync,setSync] = useState(true);
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
        data.blocksdata.map((block, blockindex) => {
            moveableBlocks.push(blockindex);
        })
        return moveableBlocks;
    }

    function moveBlock(blockindex, direction = 'up') {
        console.log('reorg moveBlock param',blockindex+','+direction);
        if((blockindex == 0) && (direction == 'up'))
            return; // ignore
        let moveableBlocks = getMoveAbleBlocks();
        console.log('moveable',moveableBlocks);
        let newposition = parseInt(direction);//in case it's a number
        let foundindex = moveableBlocks.indexOf(blockindex);
        console.log('reorg found index '+foundindex+' for blockindex' + blockindex)
        if(direction == 'up')
            newposition = moveableBlocks[foundindex - 1];
        else if(direction == 'down')
            newposition = moveableBlocks[foundindex + 2];
        if(direction == 'delete') {
            console.log('delete from '+blockindex);
            data.blocksdata.splice(blockindex,2);
        }
        else {
            console.log('reorg new position:'+newposition+' from '+blockindex);
            console.log('reorg move blocks, current blocks',data.blocksdata);
            let currentblock = data.blocksdata[blockindex];
            data.blocksdata[blockindex] = {'blockName':null};
            data.blocksdata.splice(newposition,0,currentblock);
            console.log('reorg move '+blockindex+' to '+newposition);
        }
        console.log('reorg move blocks, new blocks',data.blocksdata);
        
        data.changed = 'blocks';
        updateAgenda.mutate(data);
    }

    function ReorgButtons(props) {
        const {blockindex, role} = props;
        return (
            <div className="movebuttons">
            <div><Inserter blockindex={blockindex} insertBlock={insertBlock} moveBlock={moveBlock} post_id={post_id} makeNotification={makeNotification} setRefetchInterval={setRefetchInterval} /> </div>
            </div>
        );
    }

    function insertBlock(blockindex, attributes={}, blockname = 'wp4toastmasters/role',innerHTML='', edithtml='') {
        let newblocks = [];
        data.blocksdata.forEach(
            (block, index) => {
                newblocks.push(block);
                if(index == blockindex) {
                    console.log('newblock',{'blockName': blockname, 'DnDid':'temp'+Date.now(),'assignments': [], 'attrs': attributes,'innerHTML':innerHTML,'edithtml':edithtml});
                    newblocks.push({'blockName': blockname, 'assignments': [], 'attrs': attributes,'innerHTML':innerHTML,'edithtml':edithtml});
                }
            }
        );
        data.blocksdata = newblocks;
        updateAgenda.mutate(data);
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
        updateAgenda.mutate(data);
    }

    function makeExcerpt(html) {
        let excerpt =  html.replaceAll(/<[^>]+>/g,' ');
        if(excerpt.length > 150)
        excerpt = excerpt.substring(0,150) + '...';
        return excerpt;
    }

function onDragEnd(result) {
    const items = Array.from(data.blocksdata);
    console.log('drag result',result);
    let source = result.source.index;
    let destination = (result.destination) ? result.destination.index : null;
    console.log('drag source',source);
    console.log('drag destination',destination);
    if (!destination)
        destination = items.length;
    else if(destination > source)
        destination -= 1;
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(destination, 0, reorderedItem);
    updateAgenda.mutate({...data,blocksdata: items});
}

    const raw = ['core/image','core/paragraph','core/heading','wp4toastmasters/signupnote']
    let date = new Date(data.datetime);
    const dateoptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const localedate = date.toLocaleDateString('en-US',dateoptions);
    data.blocksdata.map((block, blockindex) => {
        data.blocksdata[blockindex].datestring = date.toLocaleTimeString('en-US',{'hour': "2-digit", 'minute': "2-digit",'hour12':true});
        if(block?.attrs?.time_allowed) {
            date.setMilliseconds(date.getMilliseconds() + (parseInt(block.attrs.time_allowed) * 60000) );
            if(block.attrs.padding_time)
                date.setMilliseconds(date.getMilliseconds() + (parseInt(block.attrs.padding_time) * 60000) );
            data.blocksdata[blockindex].datestring = data.blocksdata[blockindex].datestring.concat( ' to '+ date.toLocaleTimeString('en-US',{hour: "2-digit", minute: "2-digit",hour12:true}) );
        }});

    const moveableBlocks = getMoveAbleBlocks ();

    const getListStyle = isDraggingOver => ({
      background: isDraggingOver ? "white" : "white",
    });
    
    const getItemStyle = (isDragging, draggableStyle) => {
      //console.log('draggableStyle',draggableStyle);
      return ({
        // some basic styles to make the items look a bit nicer
        userSelect: "none",

        minHeight: "52px",
      
        // change background colour if dragging
        background: isDragging ? "lightgreen" : "#EFEFEF",
        borderBottom: "medium solid #7C2128",
        marginBottom: "5px",
      
        // styles we need to apply on draggables
        ...draggableStyle
      });
    } 

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
    let label;

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="agendawrapper" id={"agendawrapper"+post_id}>
            <>{('rsvpmaker' != wpt_rest.post_type) && <SelectControl label="Choose Event" value={post_id} options={data.upcoming} onChange={(value) => {setPostId(parseInt(value)); makeNotification('Date changed, please wait for the date to change ...'); queryClient.invalidateQueries(['blocks-data',post_id]); refetch();}} />}</>
            <h4>{localedate} {data.is_template && <span>(Template)</span>} </h4>
            <ModeControl />
            <Droppable droppableId="droppable">
            {
              (provided, snapshot) => (
                <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={getListStyle(snapshot.isDraggingOver)}  
                >
            {data.blocksdata.map((block, blockindex) => {
                if(!block.blockName)
                    return null;
                else {
                  block.blockName.replace(/^[^/]+\//,'');

                  return (
                <>
                  <div className="reorgdrag">
                  <div className="reorgdragup"><button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }><Up /></button></div>
                  <div className="reorgdragdown"><button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }><Down /></button></div>
                  <div className="reorganize-drag">
                  <Draggable key={block.DnDid} draggableId={block.DnDid} index={blockindex}>
                  {(provided, snapshot) => { //console.log('is dragging',snapshot.isDragging);
                  if(snapshot.isDragging)
                    console.log('snapshot',snapshot);
                  return (
                    <div 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={getItemStyle(
                        snapshot.isDragging,
                        provided.draggableProps.style
                      )}
                    >
                    <div><strong>{block.datestring}</strong></div>
                    <h2>{block.blockName.replace(/^[^/]+\//,'').replace('agendanoterich2','agenda note')}: {block.attrs.role && <span>{block.attrs.role}</span>} {block.attrs.editable && <span>{block.attrs.editable}</span>} {block.innerHTML && <span>{makeExcerpt(block.innerHTML)}</span>}</h2>
                    </div>
                  ) } }
                </Draggable>
                </div>
                {showDetails && 'wp4toastmasters/help' == block.blockName && <p>See the knowledge base article <a href="https://www.wp4toastmasters.com/knowledge-base/editing-agendas-and-agenda-templates-with-the-front-end-organize-screen/">Editing agendas and agenda templates with the front-end Organize screen</a> for video and written instructions.</p>}
                {'wp4toastmasters/role' == block.blockName && (<div>
                    {showDetails && <RoleBlock agendadata={data} block={block} apiClient={apiClient} blockindex={blockindex} mode={mode} updateAssignment={updateAssignment} />}
                    <div className="tmflexrow"><div className="tmflex30"><NumberControl label="Signup Slots" min="1" value={(block.attrs.count) ? block.attrs.count : 1} onChange={ (value) => { data.blocksdata[blockindex].attrs.count = value; if(['Speaker','Evaluator'].includes(block.attrs.role)) { data.blocksdata[blockindex].attrs.time_allowed = calcTimeAllowed(block.attrs); data.blocksdata = syncToEvaluator(data.blocksdata,value); } updateAgenda.mutate(data); }} /></div><div className="tmflex30"><NumberControl label="Time Allowed" value={(block.attrs?.time_allowed) ? block.attrs?.time_allowed : calcTimeAllowed(block.attrs)} onChange={ (value) => { data.blocksdata[blockindex].attrs.time_allowed = value; updateAgenda.mutate(data); }} /></div> {('Speaker' == block.attrs.role) && <div className="tmflex30"><NumberControl label="Padding Time" min="0" value={block.attrs.padding_time} onChange={(value) => {data.blocksdata[blockindex].attrs.padding_time = value; updateAgenda.mutate(data);}} /></div>}</div>
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
            onChange={ () => {data.blocksdata[blockindex].attrs.backup = !block.attrs.backup; updateAgenda.mutate(data);}} /></p>
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
            onChange={ () => {data.blocksdata[blockindex].attrs.show_on_agenda = !block.attrs.show_on_agenda; updateAgenda.mutate(data);}} />
            </div>)}
            {'wp4toastmasters/agendaedit' == block.blockName && (
                    <div>
                    {showDetails && <EditableNote mode={mode} block={block} blockindex={blockindex} uid={block.attrs.uid} post_id={post_id} makeNotification={makeNotification} />}
                    <div className="tmflexrow"><div className="tmflex30"><NumberControl label="Time Allowed" value={(block.attrs?.time_allowed) ? block.attrs?.time_allowed : 0} onChange={ (value) => { data.blocksdata[blockindex].attrs.time_allowed = value; updateAgenda.mutate(data); }} /></div></div>
                    </div>
                ) }
                {'wp4toastmasters/agendanoterich2' == block.blockName && (
                    <div>
                    {showDetails && <EditorAgendaNote blockindex={blockindex} block={block} replaceBlock={replaceBlock} />}
                    <div className="tmflexrow"><div className="tmflex30"><NumberControl label="Time Allowed" value={(block.attrs?.time_allowed) ? block.attrs?.time_allowed : 0} onChange={ (value) => { data.blocksdata[blockindex].attrs.time_allowed = value; updateAgenda.mutate(data); }} /></div></div>
                    </div>
                ) }
                {showDetails && 'wp4toastmasters/signupnote' == block.blockName && (
                    <div>
                    <SignupNote blockindex={blockindex} block={block} replaceBlock={replaceBlock} />
                    </div>
                ) }
                {showDetails && block.innerHTML && !['wp4toastmasters/signupnote','wp4toastmasters/agendanoterich2'].includes(block.blockname) && <SanitizedHTML innerHTML={block.innerHTML} />}
                {showDetails && <Inserter blockindex={blockindex} insertBlock={insertBlock} moveBlock={moveBlock} post_id={post_id} makeNotification={makeNotification} setRefetchInterval={setRefetchInterval} />}
            </div>
            {snapshot.isDraggingOver && <div className="dropplaceholder">{provided.placeholder}</div>}
            </>
            )
                }
            })
            }
                </div>
              )

            }
            </Droppable>
            </div>
            </DragDropContext>
            );
}
