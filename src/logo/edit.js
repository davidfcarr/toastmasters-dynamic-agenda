/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {WPElement} Element to render.
 */

const { PanelBody, SelectControl } = wp.components;
const { InspectorControls } = wp.blockEditor;
const { Component, Fragment } = wp.element;
/* 		 */

export default function Edit({ attributes, setAttributes, isSelected, className }) {
	//const props = useBlockProps();
	const { src } = attributes;
	
	return (
		<div {...useBlockProps()}>
		<Fragment>
		<TmLogoInspector src={attributes.src} setAttributes={setAttributes} />
		<div className={ className }>
		<img src={src} />
		</div>
		</Fragment>
		</div>
	);
}

class TmLogoInspector extends Component {
	render() {
		const { src, setAttributes } = this.props;
		return (
			<InspectorControls key="upcominginspector">
			<PanelBody title={ __( 'Logo Version', 'rsvpmaker' ) } >
					<SelectControl
        label={__("Choice",'rsvpmaker')}
        value={ src }
        options={ [
		{value: 'https://toastmost.org/tmbranding/toastmasters-75.png', label: __('Default 75px')},
		{value: 'https://toastmost.org/tmbranding/Toastmasters150-125.png', label: __('150px')},
		{value: 'https://toastmost.org/tmbranding/Toastmasters180-150.png', label: __('180px')},
		{value: 'https://toastmost.org/tmbranding/Toastmasters200-167.png', label: __('200px')},
		{value: 'https://toastmost.org/tmbranding/Toastmasters240-200.png', label: __('240px')},
		{value: 'https://toastmost.org/tmbranding/Toastmasters300-250.png', label: __('300px')},
	] }
        onChange={ ( src ) => { setAttributes( { src: src } ) } }
    />				</PanelBody>
				</InspectorControls>
);	} }
