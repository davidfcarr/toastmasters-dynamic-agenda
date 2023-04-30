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
export default function Edit(props) {
	const { isSelected } = props;
		return (			
<div { ...useBlockProps() }>
<h2>How to Edit The Agenda - Click for Help</h2>
{isSelected && <div>
    <p>The WordPress for Toastmasters system represents meeting agendas as a series of content blocks that you work with within the same editor used for blog posts and web pages. Although it can include standard content blocks (paragraphs, headings, images), you primarily work with <strong>Role</strong> blocks and a <strong>Note</strong> blocks (the "stage directions" of your meetings). <strong>Event Templates</strong> define an abstract model of a "typical" meeting, contest, or other event, but you can use the same techniques to modify a specific event (for example, to change the number and order of roles for a given meeting).</p>
    <p>For details, see the <a target="_blank" href="https://www.wp4toastmasters.com/knowledge-base/toastmasters-meeting-templates-and-meeting-events/">Knowledge Base articles</a> on the WordPress for Toastmasters website.</p>
    <p>This special help tips block will not appear on the website or your agenda. You can delete it or leave it here to refer back to later. <em>Click anywhere outside of this box to close it.</em></p>
</div>
}
</div>
		);
}
