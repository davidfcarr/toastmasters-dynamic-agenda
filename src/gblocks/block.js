/**
 * BLOCK: wpt
 *
 * Registering a basic block with Gutenberg.
 * Simple block, renders and saves the same content without any interactivity.
 */

//  Import CSS.
import './style.scss';
import './editor.scss';
import './agenda_context.js';
//import './logo.js';

const { __ } = wp.i18n; // Import __() from wp.i18n
const { registerBlockType } = wp.blocks; // Import registerBlockType() from wp.blocks
const { RichText } = wp.blockEditor;
const { Component, Fragment } = wp.element;
const { InspectorControls, PanelBody } = wp.blockEditor;
const { TextareaControl, SelectControl, ToggleControl, TextControl, ServerSideRender } = wp.components;
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
const { subscribe } = wp.data;

var agenda = [];
var master_agenda_update = 0;

function agenda_update() {
	let geturl = wpt_rest.url+'rsvptm/v1/tweak_times?post_id='+wpt_rest.post_id;
	fetch(geturl, {
		method: 'GET',
		headers: {
		  'Content-Type': 'application/json',
		  'X-WP-Nonce': wpt_rest.nonce,
		},
	  })
	  .then(response => response.json())
	  .then(data => {
		  agenda = data;
	})
	.catch((error) => {
	  console.error('Error:', error);
	});	
}

if(wpt_rest.is_agenda)
	agenda_update();

/**
 * Register: aa Gutenberg Block.
 *
 * Registers a new block provided a unique name and an object defining its
 * behavior. Once registered, the block is made editor as an option to any
 * editor interface where blocks are implemented.
 *
 * @link https://wordpress.org/gutenberg/handbook/block-api/
 * @param  {string}   name     Block name.
 * @param  {Object}   settings Block settings.
 * @return {?WPBlock}          The block, if it has been successfully
 *                             registered; otherwise `undefined`.
 */

registerBlockType( 'wp4toastmasters/agendanoterich2', {
	// Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
	title: __( 'Toastmasters Agenda Note' ), // Block title.
	icon: 'admin-comments', // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
	category: 'common', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
	description: __('Displays "stage directions" for the organization of your meetings.','rsvpmaker'),
	keywords: [
		__( 'Toastmasters' ),
		__( 'Agenda' ),
		__( 'Rich Text' ),
	],
attributes: {
        content: {
            type: 'array',
            source: 'children',
            selector: 'p',
        },
        time_allowed: {
            type: 'string',
            default: '0',
        },
		uid: {
			type: 'string',
			default: '',
		},
		timing_updated: {
			type: 'int',
			default: agenda,
		},
        show_timing_summary: {
            type: 'boolean',
            default: false,
        },
    },

    edit: function( props ) {	

	const { attributes, attributes: { show_timing_summary, time_allowed }, className, setAttributes, isSelected } = props;
	var uid = props.attributes.uid;
	if(!uid)
		{
			var date = new Date();
			uid = 'note' + date.getTime()+Math.random();
			setAttributes({uid});
		}	
	return (
<Fragment>
<NoteInspector { ...props } />	
<div className={ props.className }>
<p><strong>Toastmasters Agenda Note</strong></p>
<RichText
	tagName="p"
	value={attributes.content}
	multiline=' '
	onChange={(content) => setAttributes({ content })}
/>
{isSelected && <div>
	<p><em>Options: see sidebar</em></p>
	<ToggleControl
            label="Show Timing Summary"
            help={
                show_timing_summary
                    ? 'Show'
                    : 'Do not show'
            }
            checked={ show_timing_summary }
			onChange={ (show_timing_summary) => setAttributes( {show_timing_summary} ) }
		/>

{show_timing_summary && 
	<ServerSideRender
block="wp4toastmasters/agendanoterich2"
attributes={ props.attributes }
/>}

</div>}
</div>
</Fragment>
);
	
    },
    save: function( { attributes, className } ) {
		//return null;
		return <RichText.Content tagName="p" value={ attributes.content } className={className} />;
    }
});

registerBlockType( 'wp4toastmasters/signupnote', {
	// Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
	title: __( 'Toastmasters Signup Form Note' ), // Block title.
	icon: 'admin-comments', // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
	category: 'common', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
	description: __('A text block that appears only on the signup form, not on the agenda.'),
	keywords: [
		__( 'Toastmasters' ),
		__( 'Signup' ),
		__( 'Rich Text' ),
	],
attributes: {
        content: {
            type: 'array',
            source: 'children',
            selector: 'p',
        },
    },

    edit: function( props ) {	
	const { attributes, setAttributes } = props;

	return (<Fragment>
		<DocInspector />	
		<div className={ props.className }>
				<strong>Toastmasters Signup Form Note</strong><RichText
                tagName="p"
                className={props.className}
                value={props.attributes.content}
                onChange={(content) => setAttributes({ content })}
            />
			</div>
			</Fragment>
);
	
    },
    save: function(props) {
	
    return <RichText.Content tagName="p" value={ props.attributes.content } className={props.className} />;
    }

} );

registerBlockType( 'wp4toastmasters/role', {
	// Role [toastmaster role="Toastmaster of the Day" count="1" agenda_note="Introduces supporting roles. Leads the meeting." time="" time_allowed="2" padding_time="0" ]

	// Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
	title: __( 'Toastmasters Agenda Role' ), // Block title.
	icon: 'groups', // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
	category: 'common', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
	description: __('Defines a meeting role that will appear on the signup form and the agenda.'),
	keywords: [
		__( 'Toastmasters' ),
		__( 'Agenda' ),
		__( 'Role' ),
	],
attributes: {
        role: {
            type: 'string',
            default: '',
        },
        custom_role: {
            type: 'string',
            default: '',
        },
        count: {
            type: 'int',
            default: 1,
        },
        start: {
            type: 'int',
            default: 1,
        },
        agenda_note: {
            type: 'string',
            default: '',
        },
        time_allowed: {
            type: 'string',
            default: '0',
        },
		timing_updated: {
			type: 'int',
			default: 0,
		},
        padding_time: {
            type: 'string',
            default: '0',
        },
        backup: {
            type: 'string',
            default: '',
        },
        show_timing_summary: {
            type: 'boolean',
            default: false,
        },
    },
	edit: function( props ) {
	const { attributes: { role, custom_role, count, start, agenda_note, time_allowed, padding_time, backup, show_timing_summary }, setAttributes, isSelected } = props;

		return (			
<Fragment>
<RoleInspector { ...props } />
<div className={ props.className }>
<strong>Toastmasters Role {role} {custom_role}</strong>
{isSelected && <div><p><em>Options: see sidebar</em></p>
	<ToggleControl
            label="Show Timing Summary"
            help={
                show_timing_summary
                    ? 'Show'
                    : 'Do not show'
            }
            checked={ show_timing_summary }
			onChange={ (show_timing_summary) => setAttributes( {show_timing_summary} ) }
		/>
{show_timing_summary && 
	<ServerSideRender
block="wp4toastmasters/role"
attributes={ props.attributes }
/>}
</div>
}
</div>
</Fragment>
		);
	},
    save: function (props) { return null; },

} );

registerBlockType( 'wp4toastmasters/agendaedit', {

	// Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
	title: __( 'Toastmasters Editable Note' ), // Block title.
	icon: 'welcome-write-blog', // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
	category: 'common', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
	keywords: [
		__( 'Toastmasters' ),
		__( 'Agenda' ),
		__( 'Editable' ),
	],
	description: __('A note that can be edited by a meeting organizer'),
	attributes: {
        editable: {
            type: 'string',
            default: '',
        },
		uid: {
			type: 'string',
			default: '',
		},
		time_allowed: {
			type: 'string',
			default: '0',
		},
		timing_updated: {
			type: 'int',
			default: 0,
		},
		inline: {
			type: 'int',
			default: 0,
		},
		show_timing_summary: {
            type: 'boolean',
            default: false,
        },
    },
	edit: function( props ) {

	const { attributes: { editable, show_timing_summary }, setAttributes, isSelected } = props;

	var uid = props.attributes.uid;
	if(!uid)
		{
			var date = new Date();
			uid = 'editable' + date.getTime()+Math.random();					
			setAttributes({uid});
		}		
		return (
			<Fragment>
			<NoteInspector { ...props } />
<div className={ props.className }>
<p class="dashicons-before dashicons-welcome-write-blog"><strong>Toastmasters Editable Note</strong></p>

<TextControl
        label="Label"
        value={ editable }
        onChange={ ( editable ) => setAttributes( { editable } ) }
    />

{isSelected && <div><em>Options: see sidebar</em>
	<ToggleControl
            label="Show Timing Summary"
            help={
                show_timing_summary
                    ? 'Show'
                    : 'Do not show'
            }
            checked={ show_timing_summary }
			onChange={ (show_timing_summary) => setAttributes( {show_timing_summary} ) }
		/>

	{show_timing_summary && 
	<ServerSideRender
block="wp4toastmasters/agendaedit"
attributes={ props.attributes }
/>}
</div>}
</div>
</Fragment>
		);
	},
    save: function (props) { return null; },

} ); 

registerBlockType( 'wp4toastmasters/milestone', {

	// Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
	title: __( 'Toastmasters Milestone' ), // Block title.
	icon: 'welcome-write-blog', // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
	category: 'common', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
	keywords: [
		__( 'Toastmasters' ),
		__( 'Agenda' ),
		__( 'Milestone' ),
	],
	description: __('Milestone such as the end of the meeting, displayed with time'),
	attributes: {
        label: {
            type: 'string',
            default: '',
        },
    },
	edit: function( props ) {

	const { attributes: { label }, setAttributes, isSelected } = props;
		
		return (
<div className={ props.className }>
<p class="dashicons-before dashicons-clock"><strong>Toastmasters Agenda Milestone</strong></p>
<TextControl
        label="Label for Milestone"
        value={ label }
        onChange={ ( label ) => setAttributes( { label } ) }
    />
</div>
		);
	},
    save: function (props) { 
	const { attributes: { label } } = props;
		
		return (
<p maxtime="x">{label}</p>
	) },

} ); 

registerBlockType( 'wp4toastmasters/absences', {
	// Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
	title: __( 'Toastmasters Absences' ), // Block title.
	icon: 'admin-comments', // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
	category: 'common', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
	keywords: [
		__( 'Toastmasters' ),
		__( 'Agenda' ),
		__( 'Absences' ),
	],
	description: __('A button on the signup form where members can record a planned absence.'),
	attributes: {
       show_on_agenda: {
            type: 'int',
            default: 0,
        },
    },
    edit: function( props ) {	
	const { attributes: { show_on_agenda }, setAttributes, isSelected } = props;

	function setShowOnAgenda() {
		const selected = event.target.querySelector( '#show_on_agenda option:checked' );
		setAttributes( { show_on_agenda: selected.value } );
		event.preventDefault();		
	}
	function showForm() {
return (<form onSubmit={ setShowOnAgenda } >
<label>Show on Agenda?</label> <select id="show_on_agenda" value={ show_on_agenda } onChange={ setShowOnAgenda }>
<option value="0">No</option>
<option value="1">Yes</option>
</select></form>);		
		}

	return (
		<Fragment>
		<DocInspector />
		<div className={ props.className }>
				<strong>Toastmasters Absences</strong> placeholder for widget that tracks planned absences
			{showForm()}
			</div>
		</Fragment>
);
	
    },
    save: function(props) {
    return null;
    }
} ); 

registerBlockType( 'wp4toastmasters/hybrid', {
	// Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
	title: __( 'Toastmasters Hybrid' ), // Block title.
	icon: 'admin-comments', // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
	category: 'common', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
	keywords: [
		__( 'Toastmasters' ),
		__( 'Agenda' ),
		__( 'Hybrid' ),
	],
	description: __('Allows hybrid clubs to track which members will attend in person'),
	attributes: {
		limit: {
            type: 'int',
            default: 0,
        },
    },
    edit: function( props ) {	
	const { attributes: { limit }, setAttributes, isSelected } = props;

	return (
		<Fragment>
		<HybridInspector { ...props } />
		<div className={ props.className }>
				<strong>Toastmasters Hybrid</strong> Placeholder for widget that allows hybrid clubs to track who will attend in person, rather than online
			</div>
		</Fragment>
);
	
    },
    save: function(props) {
    return null;
    }
} ); 

class RoleInspector extends Component {

	render() {
		const { attributes, setAttributes, className } = this.props;
		const { count, time_allowed, padding_time, agenda_note, backup, role, custom_role } = attributes;

return (	
<InspectorControls key="roleinspector">
<SelectControl
				label={ __( 'Role', 'rsvpmaker-for-toastmasters' ) }
				value={ role }
				onChange={ ( role ) => setAttributes( { role } ) }
				options={ toast_roles }
/>

<TextControl
        label="Custom Role"
        value={ custom_role }
        onChange={ ( custom_role ) => setAttributes( { custom_role } ) }
/>

<div style={ {width: '60%'} }>	<NumberControl
		label={ __( 'Count', 'rsvpmaker-for-toastmasters' ) }
		value={ count }
		onChange={ ( count ) => setAttributes( { count } ) }
	/>
	</div>
<div>
<p><em><strong>Count</strong> sets multiple instances of a role like Speaker or Evaluator.</em></p>
</div>
{
(role == 'Speaker') && 
<div>
<div style={{width: '45%', float: 'left'}}>
					<NumberControl
							label={ __( 'Time Allowed', 'rsvpmaker-for-toastmasters' ) }
							value={ time_allowed }
							min={0}
							onChange={ ( time_allowed ) => setAttributes({ time_allowed }) }//  setAttributes( { time_allowed } ) }
						/>
</div>
<div style={{width: '45%', float: 'left', marginLeft: '5%' }}>
			<NumberControl
				label={ __( 'Padding Time', 'rsvpmaker-for-toastmasters' ) }
				min={0}
				value={ padding_time }
				onChange={ ( padding_time ) => setAttributes({ padding_time }) }
			/>
</div>
<p><em><strong>Time Allowed</strong>: Total minutes allowed on the agenda. In the case of speeches, limits the time that can be booked for speeches without a warning. Example: 24 minutes for 3 speeches, one of which might be longer than 7 minutes.</em></p>
<p><em><strong>Padding Time</strong>: Typical use is extra time for introductions, beyond the time allowed for speeches.</em></p>
</div>
}
{
(role != 'Speaker') && 
<div>
					<NumberControl
							label={ __( 'Time Allowed', 'rsvpmaker-for-toastmasters' ) }
							min={0}
							value={ time_allowed }
							onChange={ ( time_allowed ) => setAttributes({ time_allowed }) }//  setAttributes( { time_allowed } ) }
						/>
<p><em><strong>Time Allowed</strong>: Total minutes allowed on the agenda. In the case of speeches, limits the time that can be booked for speeches without a warning. Example: 24 minutes for 3 speeches, one of which might be longer than 7 minutes.</em></p>
</div>
}
<div>
<p>Scheduling overview: <a href={wp.data.select('core/editor').getPermalink()+'??tweak_times=1'}>{__('Agenda Time Planner','rsvpmaker')}</a></p>
</div>

<TextareaControl
        label="Agenda Note"
        help="A note that appears immediately below the role on the agenda and signup form"
        value={ agenda_note }
        onChange={ ( agenda_note ) => setAttributes( { agenda_note: fix_quotes_in_note(agenda_note) } ) }
    />
<SelectControl
				label={ __( 'Backup for this Role', 'rsvpmaker-for-toastmasters' ) }
				value={ backup }
				onChange={ ( backup ) => setAttributes( { backup } ) }
				options={ [{value: '0', label: 'No'},{value: '1', label: 'Yes'}] }
			/>
{docContent ()}
</InspectorControls>
		);
	}
}

function fix_quotes_in_note(agenda_note) {
	agenda_note = agenda_note.replace('"','\u0026quot;');
	agenda_note = agenda_note.replace('\u0022','\u0026quot;');
	return agenda_note;
}

function docContent () {
	return (<div><p><a href="https://wp4toastmasters.com/knowledge-base/toastmasters-meeting-templates-and-meeting-events/" target="_blank">{__('Agenda Setup Documentation','rsvpmaker')}</a></p>
	<p>Add additional agenda notes roles and other elements by clicking the + button (top left of the screen or adjacent to other blocks of content). If the appropriate blocks aren't visible, start typing "toastmasters" in the search blank as shown below.</p>
	<p><img src="/wp-content/plugins/rsvpmaker-for-toastmasters/images/gutenberg-blocks.png" /></p>
	<p>Most used agenda content blocks:</p>
	<ul>
	<li><a target="_blank" href="https://wp4toastmasters.com/knowledge-base/add-or-edit-an-agenda-role/">Agenda Role</a></li><li><a target="_blank" href="https://wp4toastmasters.com/knowledge-base/add-an-agenda-note/">Agenda Note</a></li><li><a target="_blank" href="https://wp4toastmasters.com/knowledge-base/editable-agenda-blocks/">Editable Note</a></li><li><a target="_blank" href="https://wp4toastmasters.com/2018/04/11/tracking-planned-absences-agenda/">Toastmasters Absences</a></li>
	</ul></div>);
}

class NoteInspector extends Component {

	render() {

		const { attributes, setAttributes } = this.props;
		const { time_allowed, editable, inline } = attributes;

		return (
		<InspectorControls key="noteinspector">
{ editable && 
	<ToggleControl
        label="Display inline label, bold, instead of headline"
        help={ inline ? 'Inline Label' : 'Headline' }
        checked={ inline }
        onChange={ (inline) => setAttributes( {inline} ) }
    />
}			

			<NumberControl
					label={ __( 'Time Allowed', 'rsvpmaker-for-toastmasters' ) }
					min={0}
					value={ time_allowed }
					onChange={ ( time_allowed ) => setAttributes({ time_allowed }) }
				/>
<p>Scheduling overview: <a href={wp.data.select('core/editor').getPermalink()+'??tweak_times=1'}>{__('Agenda Time Planner','rsvpmaker')}</a></p>
{docContent ()}
			</InspectorControls>
		);
	}
}

class HybridInspector extends Component {

	render() {

		const { attributes, setAttributes } = this.props;
		const { limit } = attributes;

		return (
		<InspectorControls key="hybridinspector">
			<NumberControl
					label={ __( 'Attendance limit (0 for none)', 'rsvpmaker-for-toastmasters' ) }
					min={0}
					value={ limit }
					onChange={ ( limit ) => setAttributes({ limit }) }
				/>
{docContent ()}
			</InspectorControls>
		);
	}
}

class DocInspector extends Component {

	render() {

		return (
		<InspectorControls key="docinspector">
{docContent ()}
			</InspectorControls>
		);
	}
}

registerBlockType( 'wp4toastmasters/duesrenewal', {
	// Role [toastmaster role="Toastmaster of the Day" count="1" agenda_note="Introduces supporting roles. Leads the meeting." time="" time_allowed="2" padding_time="0" ]

	// Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
	title: __( 'Dues Renewal' ), // Block title.
	icon: 'groups', // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
	category: 'common', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
	description: __('Displays a member dues renewal form.'),
	keywords: [
		__( 'Toastmasters' ),
		__( 'Dues' ),
		__( 'Payment' ),
	],
	edit: function( props ) {
	const { attributes: { amount }, setAttributes, isSelected } = props;
		return (			
<div className={ props.className }>
<p><strong>Toastmasters Dues Renewal</strong> - displays the payment form</p>
<p>{__('Payment will be calculated according to the dues schedule set in','rsvpmaker-for-toastmasters')}<br />{__('Settings > TM Member Application','rsvpmaker-for-toastmasters')}</p>
</div>
		);
	},
    save: function (props) { return null; },

} );

