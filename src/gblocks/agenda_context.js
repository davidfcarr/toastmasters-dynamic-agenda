/**
 * BLOCK: Agenda context display
 *
 */

const { __ } = wp.i18n;
const { registerBlockType } = wp.blocks;
const { Fragment } = wp.element;
import { InnerBlocks } from '@wordpress/block-editor';
const { Component } = wp.element;
const { InspectorControls } = wp.blockEditor;
const { PanelBody, ToggleControl, SelectControl } = wp.components;

registerBlockType( 'wp4toastmasters/context', {
	title: ( 'Agenda Display Wrapper' ), // Block title.
	icon: 'admin-comments', 
	category: 'common',
	keywords: [
		( 'Toastmasters' ),
		( 'Agenda Wrapper' ),
		( 'Wrapper' ),
	],
attributes: {
        content: {
            type: 'array',
            source: 'children',
            selector: 'p',
        },
	webContext: {
		type: 'boolean',
		default: true,
	},
	emailContext: {
		type: 'boolean',
		default: true,
	},
	agendaContext: {
		type: 'boolean',
		default: true,
	},
	printContext: {
		type: 'boolean',
		default: true,
	},
	anonContext: {
		type: 'boolean',
		default: true,
	},
},

    edit: function( props ) {	

	const { attributes, className, setAttributes, isSelected } = props;
	const {webContext, emailContext, agendaContext, printContext } = attributes;

	return (
		<Fragment>
		<ContextInspector { ...props } />
<div className={className} >
<div class="context-block-label">CLICK TO SET DISPLAY CONTEXT</div>
	<InnerBlocks />
</div>
		</Fragment>
		);
    },
    save: function( { attributes, className } ) {
		return <div className={className}><InnerBlocks.Content /></div>;
    }
});

class ContextInspector extends Component {

	render() {
		
		const { attributes, className, setAttributes, isSelected } = this.props;
		const {webContext, emailContext, agendaContext, printContext, anonContext } = attributes;
		return (
			<InspectorControls key="contextInspector">
			<PanelBody title={ __( 'Display', 'rsvpmaker-for-toastmasters' ) } >
			<ToggleControl
            label="Web / Signup Page"
            help={
                webContext
                    ? 'Show on website / agenda signup view.'
                    : 'Do not show on website / agenda signup view.'
            }
            checked={ webContext }
			onChange={ (webContext) => setAttributes( {webContext} ) }
		/>
			<ToggleControl
            label="Agenda"
            help={
                agendaContext
                    ? 'Show on agenda (email or print).'
                    : 'Do not show on agenda (email or print).'
            }
            checked={ agendaContext }
			onChange={ (agendaContext) => setAttributes( {agendaContext} ) }
		/>
		
		<ToggleControl
            label="Email"
            help={
                emailContext
                    ? 'Show on email agenda.'
                    : 'Do not show on email agenda.'
            }
            checked={ emailContext }
			onChange={ (emailContext) => setAttributes( {emailContext} ) }
		/>

			<ToggleControl
            label="Print"
            help={
                printContext
                    ? 'Show on print agenda.'
                    : 'Do not show on print agenda.'
            }
            checked={ printContext }
			onChange={ (printContext) => setAttributes( {printContext} ) }
		/>
			<ToggleControl
            label="Anonymous Users"
            help={
                anonContext
                    ? 'No login required.'
                    : 'Limit to logged in users and club email notifications.'
            }
            checked={ anonContext }
			onChange={ (anonContext) => setAttributes( {anonContext} ) }
		/>
		</PanelBody>
			</InspectorControls>
		);
	}
}