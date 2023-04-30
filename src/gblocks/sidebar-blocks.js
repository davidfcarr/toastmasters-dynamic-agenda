const { __ } = wp.i18n; // Import __() from wp.i18n
const { registerBlockType } = wp.blocks; // Import registerBlockType() from wp.blocks
const { Component, Fragment } = wp.element;
const { InspectorControls, PanelBody } = wp.blockEditor;
const { TextControl, ToggleControl, SelectControl } = wp.components;
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';

registerBlockType( 'wp4toastmasters/memberaccess', {
	// Role [toastmaster role="Toastmaster of the Day" count="1" agenda_note="Introduces supporting roles. Leads the meeting." time="" time_allowed="2" padding_time="0" ]

	// Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
	title: __( 'Toastmasters Member Access' ), // Block title.
	icon: 'groups', // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
	category: 'common', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
	description: __('Displays member singup opportunities, profile links, etc.'),
	keywords: [
		__( 'Toastmasters' ),
		__( 'Sidebar' ),
		__( 'Member' ),
	],
attributes: {
        title: {
            type: 'string',
            default: 'Member Access',
        },
        dateformat: {
            type: 'string',
            default: 'M j',
        },
        limit: {
            type: 'int',
            default: 10,
        },
        showmore: {
            type: 'int',
            default: 4,
        },
        showlog: {
            type: 'boolean',
            default: true,
        },
    },
	edit: function( props ) {
	const { title, limit, showlog, showmore } = props.attributes;

const dates = [];
for(let i=1; i <= limit; i++) {
    dates.push(<div ><div class="meetinglinks"><a class="meeting" href="#">Toastmasters Meeting Jan {i}</a></div></div>);
} 
        
        return (			
<Fragment>
<MemberAccessInspector { ...props } />
<div className={ props.className }>
{title && <h5 class="member-access-title">{title}</h5>}	  
<ul class="member-access-prompts">
<li class="widgetsignup">Member sign up for roles:
{dates}
{showmore && <div id="showmorediv"><a href="#" id="showmore">Show More</a></div>}
</li>
<li>Your membership:<div><a href="#">Edit Member Profile</a></div><div><a href="#">Member Dashboard</a></div></li>
{showlog && <li><strong>Activity</strong><br />
<div><strong>Demo Member:</strong> signed up for Toastmaster of the Day for December 1st, 2022 <small><em>(Posted: 11/06/22 13:25)</em></small></div>
<div><strong>Demo Member:</strong> signed up for Speaker for February 1st, 2023 <small><em>(Posted: 11/06/22 13:30)</em></small></div>
</li>}
</ul>
</div>
</Fragment>
		);
	},
    save: function (props) { return null; },

} );

class MemberAccessInspector extends Component {

	render() {

		const { attributes, setAttributes } = this.props;
		const { title, dateformat, limit, showmore, showlog } = attributes;
        console.log(title);
        console.log(dateformat);
        console.log(limit);
        console.log(showmore);
        console.log(showlog);
/*
 key="memberaccessinspector"
*/
		return (
		<InspectorControls>
        <TextControl
        label="Title"
        value={ title }
        onChange={ ( title ) => setAttributes( { title } ) }
    />
        <NumberControl
                label={ __( 'Number of Meetings Shown', 'rsvpmaker-for-toastmasters' ) }
                min={0}
                value={ limit }
                onChange={ ( limit ) => setAttributes({ limit }) }
            />
            <NumberControl
                label={ __( 'Show More Number', 'rsvpmaker-for-toastmasters' ) }
                min={0}
                value={ showmore }
                onChange={ ( showmore ) => setAttributes({ showmore }) }
            />
        <ToggleControl
            label="Show Activity Log"
            help={
                showlog
                    ? 'Show'
                    : 'Do not show'
            }
            checked={ showlog }
			onChange={ (showlog) => setAttributes( {showlog} ) }
		/>
<TextControl
        label="Date Format"
        value={ dateformat }
        onChange={ ( dateformat ) => setAttributes( { dateformat } ) }
    />
    <p><a href="https://www.php.net/manual/en/datetime.format.php" target="_blank">Uses PHP date format codes</a></p>
        </InspectorControls>
		);
	}
}

registerBlockType( 'wp4toastmasters/blog', {
	// Role [toastmaster role="Toastmaster of the Day" count="1" agenda_note="Introduces supporting roles. Leads the meeting." time="" time_allowed="2" padding_time="0" ]

	// Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
	title: __( 'Toastmasters Public/Private Blogs' ), // Block title.
	icon: 'groups', // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
	category: 'common', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
	description: __('Club News and Members Only Blog Posts'),
	keywords: [
		__( 'Toastmasters' ),
		__( 'Sidebar' ),
		__( 'Blog' ),
	],
attributes: {
        title: {
            type: 'string',
            default: 'Members Only',
        },
        type: {
            type: 'string',
            default: 'private',
        },
        number: {
            type: 'int',
            default: 10,
        },
    },
	edit: function( props ) {
	const { title, type, number } = props.attributes;

const dates = [];
for(let i=1; i <= number; i++) {
    dates.push(<li><a href="#">Post Title <em>{type}</em></a> Date</li>);
}         
        return (			
<Fragment>
<ToastBlogInspector { ...props } />
<div className={ props.className }>
{title && <h5>{title}</h5>}	  
<ul>
{dates}
</ul>
</div>
</Fragment>
		);
	},
    save: function (props) { return null; },

} );

class ToastBlogInspector extends Component {

	render() {

		const { attributes, setAttributes } = this.props;
		let { title, type, number } = attributes;
        if(('private' === type) && ('Club News' === title)) {
            title = 'Members Only';
            setAttributes( { title } );
        }
        if(('public' === type) && ('Members Only' === title)) {
            title = 'Club News';
            setAttributes( { title } );
        }
        console.log(title);
		return (
		<InspectorControls>
        <TextControl
        label="Title"
        value={ title }
        onChange={ ( title ) => setAttributes( { title } ) }
    />
 <SelectControl
				label={ __( 'Type', 'rsvpmaker-for-toastmasters' ) }
				value={ type }
				onChange={ ( type ) => setAttributes( { type } ) }
				options={ [{value: 'private', label: 'private'},{value: 'public', label: 'public'}] }
/>
       <NumberControl
                label={ __( 'Number of Posts', 'rsvpmaker-for-toastmasters' ) }
                min={0}
                value={ number }
                onChange={ ( number ) => setAttributes({ number }) }
            />
        </InspectorControls>
		);
	}
}

registerBlockType( 'wp4toastmasters/newestmembers', {
	// Role [toastmaster role="Toastmaster of the Day" count="1" agenda_note="Introduces supporting roles. Leads the meeting." time="" time_allowed="2" padding_time="0" ]

	// Block name. Block names must be string that contains a namespace prefix. Example: my-plugin/my-custom-block.
	title: __( 'Toastmasters Newest Members' ), // Block title.
	icon: 'groups', // Block icon from Dashicons → https://developer.wordpress.org/resource/dashicons/.
	category: 'common', // Block category — Group blocks together based on common traits E.g. common, formatting, layout widgets, embed.
	description: __('Toastmasters newest members by user record'),
	keywords: [
		__( 'Toastmasters' ),
		__( 'Sidebar' ),
		__( 'Newest Members' ),
	],
attributes: {
        title: {
            type: 'string',
            default: 'Newest Members',
        },
        number: {
            type: 'int',
            default: 5,
        },
    },
	edit: function( props ) {
	const { title, number } = props.attributes;

const dates = [];
for(let i=1; i <= number; i++) {
    dates.push(<li>Member {i}</li>);
}         
        return (			
<Fragment>
<ToastNewInspector { ...props } />
<div className={ props.className }>
{title && <h5>{title}</h5>}
<ul>{dates}</ul>
</div>
</Fragment>
		);
	},
    save: function (props) { return null; },

} );

class ToastNewInspector extends Component {

	render() {

		const { attributes, setAttributes } = this.props;
		const { title, number } = attributes;
		return (
		<InspectorControls>
        <TextControl
        label="Title"
        value={ title }
        onChange={ ( title ) => setAttributes( { title } ) }
    />
       <NumberControl
                label={ __( 'Number of Members', 'rsvpmaker-for-toastmasters' ) }
                min={0}
                value={ number }
                onChange={ ( number ) => setAttributes({ number }) }
            />
        </InspectorControls>
		);
	}
}
