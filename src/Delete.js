import React, {useState, useRef} from "react"
import {Delete} from './icons.js';

export default function DeleteButton(props) {
    const [deletemode,setDeleteMode] = useState(false);
    const {blockindex, moveBlock, data} = props;
        return <>{!deletemode && <p><button className="blockmove deletebutton" onClick={() => {setDeleteMode(true);}}><Delete /> Delete</button></p>} {deletemode && <p><button className="blockmove" onClick={() => {moveBlock(blockindex, 'delete', data);}}><Delete /> Confirm Delete</button></p>} </>
}