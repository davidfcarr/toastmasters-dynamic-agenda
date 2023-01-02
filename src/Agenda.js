import React, {useState, useEffect, useRef} from "react"
import RoleBlock from './RoleBlock.js';
import { TextareaControl, SelectControl, ToggleControl, TextControl } from '@wordpress/components';

export default function Agenda() {
    let initialPost = 0;
    if('rsvpmaker' == wpt_rest.post_type) {
        initialPost = wpt_rest.post_id;
    } else {
        initialPost = new URL(document.location).searchParams.get('post_id');
        if(!initialPost)
            initialPost = 0;    
    }
    const [agenda, setAgenda] = useState([]);
    const [updated, setUpdated] = useState(null);
    const [post_id, setPostId] = useState(initialPost);
    let upcoming = [];
    let current_user_id = 0;

    useEffect( () => {
        fetch(wpt_rest.url + 'rsvptm/v1/blocks_data/'+post_id, {headers: {'X-WP-Nonce': wpt_rest.nonce}})
        .then((response) => response.json())
        .then((data) => {
            if(data && data.blocksdata) {
                setAgenda(data);
                setPostId(data.post_id);
                upcoming = data.upcoming;
                current_user_id = data.current_user_id;
            } 
        });
    },[updated,post_id]);

    if(!agenda.blocksdata)
        return <p>Loading ...</p>;
    //console.log('current_user_id ' + agenda.current_user_id);
    const raw = ['core/image','core/paragraph','core/heading','wp4toastmasters-signupnote']
    const ignore = ['wp4toastmasters/agendanoterich2','wp4toastmasters/milestone','wp4toastmasters/help']
    return (
        <div className="agendawrapper">
            {('rsvpmaker' != wpt_rest.post_type) && <SelectControl label="Choose Event" value={post_id} options={agenda.upcoming} onChange={(value) => setPostId(parseInt(value))} />}
            {agenda.blocksdata.map( (block, blockindex) => {
                
                if(!block.blockName || (block.blockName != 'wp4toastmasters/role') || ignore.includes(block.blockName))
                    return null;
                
                return <div id={'block'+blockindex}><RoleBlock current_user_id={agenda.current_user_id} setAgenda={setAgenda} setUpdated={setUpdated} post_id={post_id} role={block.attrs.role} count={block.attrs.count} time_allowed={block.attrs.time_allowed} padding_time={block.attrs.padding_time} backup={block.attrs.backup} assignments={block.assignments} /></div>

                if(raw.includes(block.blockName))
                    {
                        return <div dangerouslySetInnerHTML={{ __html: block.innerHTML }} />
                    }
                return <div id={'block'+blockindex}>{blockindex} {(block.blockName === 'wp4toastmasters/role') ? <RoleBlock current_user_id={agenda.current_user_id} setAgenda={setAgenda} setUpdated={setUpdated} post_id={post_id} role={block.attrs.role} count={block.attrs.count} time_allowed={block.attrs.time_allowed} padding_time={block.attrs.padding_time} backup={block.attrs.backup} assignments={block.assignments} memberlist={agenda.memberlist} /> : <p>{block.blockName}</p>} </div>
            } )}
        </div>
    );
}
