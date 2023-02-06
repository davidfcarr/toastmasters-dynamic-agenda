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
    const {data, mode, multiAssignmentMutation,updateAgenda,ModeControl,post_id,updateAssignment,makeNotification,setRefetchInterval} = props;
    const [showControls,setShowControls] = useState(true);    
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
            if(('wp4toastmasters/role' == block.blockName) || ('wp4toastmasters/agendanoterich2' == block.blockName) || ('wp4toastmasters/agendaedit' == block.blockName))
                moveableBlocks.push(blockindex);
            } )
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
                    console.log('newblock',{'blockName': blockname, 'assignments': [], 'attrs': attributes,'innerHTML':innerHTML,'edithtml':edithtml});
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

    function onDragEnd(result) {
      /*
      console.log('onDragEnd',result);
      console.log('onDragEnd source',result.source.index);
      console.log('onDragEnd destination',result.destination.index);
      */
      moveBlock(result.source.index,result.destination.index);
    }

    const raw = ['core/image','core/paragraph','core/heading','wp4toastmasters/signupnote']
    let date = new Date(data.datetime);
    const dateoptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let datestring = '';
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
    
    const blockclass = "block reorgblock";
    let label;

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="agendawrapper" id={"agendawrapper"+post_id}>
            <>{('rsvpmaker' != wpt_rest.post_type) && <SelectControl label="Choose Event" value={post_id} options={data.upcoming} onChange={(value) => {setPostId(parseInt(value)); makeNotification('Date changed, please wait for the date to change ...'); queryClient.invalidateQueries(['blocks-data',post_id]); refetch();}} />}</>
            <h4>{date.toLocaleDateString('en-US',dateoptions)}</h4>
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
                datestring = date.toLocaleTimeString('en-US',{hour: "2-digit", minute: "2-digit",hour12:true});
                if(block?.attrs?.time_allowed) {
                    console.log(block.blockName+' role '+block?.attrs?.role+' blocktime'+date.toLocaleTimeString('en-US',{hour: "2-digit", minute: "2-digit",hour12:true}));
                    console.log('blocktime add '+block.attrs.time_allowed+' minutes');
                    date.setMilliseconds(date.getMilliseconds() + (parseInt(block.attrs.time_allowed) * 60000) );
                    datestring = datestring+' to '+ date.toLocaleTimeString('en-US',{hour: "2-digit", minute: "2-digit",hour12:true});
                }
                console.log('draggable block',block);
                console.log('draggable blockindex',blockindex);
                // block.assignments.map((assignment) => {return <p>{assignment.name}</p>})
                if(!block.blockName)
                    return null;
                else {
                  block.blockName.replace(/^[^/]+\//,'');

                  return (
                  <div className="reorgdrag">
                  <div className="reorgdragup"><button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }><Up /></button></div>
                  <div className="reorgdragdown"><button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }><Down /></button></div>
                  <div className="reorganize-drag">
                  <Draggable key={block.attrs.uid} draggableId={block.attrs.uid} index={blockindex}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={getItemStyle(
                        snapshot.isDragging,
                        provided.draggableProps.style
                      )}
                    >
                    <div><strong>{datestring}</strong></div>
                    <h2>{block.blockName.replace(/^[^/]+\//,'').replace('agendanoterich2','agenda note')} {block.attrs.role && <span>{block.attrs.role}</span>} {block.attrs.editable && <span>{block.attrs.editable}</span>}</h2>
                    </div>
                  )}
                </Draggable>
                </div>
                {showControls && 'wp4toastmasters/role' == block.blockName && (<div>
                  <RoleBlock agendadata={data} post_id={post_id} apiClient={apiClient} blockindex={blockindex} mode={mode} attrs={block.attrs} assignments={block.assignments} updateAssignment={updateAssignment} />
                    <div className="tmflexrow"><div className="tmflex30"><NumberControl label="Signup Slots" min="1" value={(block.attrs.count) ? block.attrs.count : 1} onChange={ (value) => { data.blocksdata[blockindex].attrs.count = value; if(['Speaker','Evaluator'].includes(block.attrs.role)) data.blocksdata[blockindex].attrs.time_allowed = calcTimeAllowed(block.attrs); updateAgenda.mutate(data); }} /></div><div className="tmflex30"><NumberControl label="Time Allowed" value={(block.attrs?.time_allowed) ? block.attrs?.time_allowed : calcTimeAllowed(block.attrs)} onChange={ (value) => { data.blocksdata[blockindex].attrs.time_allowed = value; updateAgenda.mutate(data); }} /></div></div>
                    <SpeakerTimeCount block={block} makeNotification={makeNotification} />
                </div>)}
                {showControls && 'wp4toastmasters/agendaedit' == block.blockName && (
                    <div>
                    <EditableNote mode={mode} block={block} blockindex={blockindex} uid={block.attrs.uid} post_id={post_id} makeNotification={makeNotification} />
                    <div className="tmflexrow"><div className="tmflex30"><NumberControl label="Time Allowed" value={(block.attrs?.time_allowed) ? block.attrs?.time_allowed : 0} onChange={ (value) => { data.blocksdata[blockindex].attrs.time_allowed = value; updateAgenda.mutate(data); }} /></div></div>
                    </div>
                ) }
                {showControls && 'wp4toastmasters/agendanoterich2' == block.blockName && (
                    <div>
                    <EditorAgendaNote blockindex={blockindex} block={block} replaceBlock={replaceBlock} />
                    <div className="tmflexrow"><div className="tmflex30"><NumberControl label="Time Allowed" value={(block.attrs?.time_allowed) ? block.attrs?.time_allowed : 0} onChange={ (value) => { data.blocksdata[blockindex].attrs.time_allowed = value; updateAgenda.mutate(data); }} /></div></div>
                    </div>
                ) }
                {showControls && 'wp4toastmasters/signupnote' == block.blockName && (
                    <div>
                    <SignupNote blockindex={blockindex} block={block} replaceBlock={replaceBlock} />
                    </div>
                ) }
                {showControls && block.innerHTML && !['wp4toastmasters/signupnote','wp4toastmasters/agendanoterich2'].includes(block.blockname) && <SanitizedHTML innerHTML={block.innerHTML} />}
                {showControls && <Inserter blockindex={blockindex} insertBlock={insertBlock} moveBlock={moveBlock} post_id={post_id} makeNotification={makeNotification} setRefetchInterval={setRefetchInterval} />}
                <ToggleControl label="Show Contols"
            help={
                (true == showControls)
                    ? 'Show'
                    : 'Hide'
            }
            checked={ showControls }
            onChange={ () => {let newvalue = !showControls; setShowControls( newvalue ); }} />
            {provided.placeholder}
            </div>
                  )
                }
                if('wp4toastmasters/role' == block.blockName) {
                    block.assignments.forEach( (assignment,roleindex) => {console.log(block.attrs.role +': '+roleindex+' name:'+assignment.name)} );
                    return (
                    <div key={'block'+blockindex} id={'block'+blockindex} className={blockclass}>
                    <>{'reorganize' == mode && <div className="reorgcolumn"><div className="reorgupdown"><button className="blockmove" onClick={() => { moveBlock(blockindex, 'up') } }><Up /></button><br /><br /><button className="blockmove" onClick={() => { moveBlock(blockindex, 'down') } }><Down /></button></div></div>}</>
                    <div className={mode}>
                    <div><strong>{datestring}</strong></div>
                    <RoleBlock agendadata={data} post_id={post_id} apiClient={apiClient} blockindex={blockindex} mode={mode} attrs={block.attrs} assignments={block.assignments} updateAssignment={updateAssignment} />
                    <div className="tmflexrow"><div className="tmflex30"><NumberControl label="Signup Slots" min="1" value={(block.attrs.count) ? block.attrs.count : 1} onChange={ (value) => { data.blocksdata[blockindex].attrs.count = value; if(['Speaker','Evaluator'].includes(block.attrs.role)) data.blocksdata[blockindex].attrs.time_allowed = calcTimeAllowed(block.attrs); updateAgenda.mutate(data); }} /></div><div className="tmflex30"><NumberControl label="Time Allowed" value={(block.attrs?.time_allowed) ? block.attrs?.time_allowed : calcTimeAllowed(block.attrs)} onChange={ (value) => { data.blocksdata[blockindex].attrs.time_allowed = value; updateAgenda.mutate(data); }} /></div></div>
                    <SpeakerTimeCount block={block} makeNotification={makeNotification} />
                    <ReorgButtons blockindex={blockindex} role={block.attrs.role} />
                    </div>
                    </div>
                    )
                }
                else {
                    return <div>{block.blockName}</div>                  
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
