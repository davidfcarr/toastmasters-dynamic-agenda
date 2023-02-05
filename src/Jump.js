    function Jump (props) {
        const {mode, blockindex} = props;
        const [destination, setDestination] = useState('');
        const [options,setOptions] = useState([]);
        if('reorganize' != mode)
            return null;
            if(!options.length) {
                const jump = [{'value':'','label':'Where do you want to move?'}];
                let label;
                axiosdata.data.blocksdata.forEach(
                    (block, index) => {
                        if(!block.blockName)
                            return;
                        if((index != blockindex) && (index != blockindex+1)) {
                            label = block.blockName.replace(/^[^/]+\//,'');
                            if(('role' == label) && block.attrs.role)
                                label = block.attrs.role;
                            else if(('agendaedit' == label) && block.attrs.editable)
                                label = block.attrs.editable;
                            else if(typeof block.innerHTML != 'undefined') {
                                label = label + block.innerHTML.replace(/<[^>]+>/,'').replace("\n",' ');
                                label = label.substring(0,25)+'...';
                            }
                            jump.push({'label': label,'value':index});
                        }
                    }
                );    
                setOptions(jump);
            }
        return (
            <p><SelectControl value={destination} options={options} onChange={(value) => {setDestination(value); moveBlock(blockindex,value)}} /></p>
        )
    }
