import { camelCase } from 'change-case';
import * as decode from 'decode-html';
import * as styleparser from 'style-parser';
import { Widget } from '../models/flutter-model';
import { applyOnDescendants, findAndRemoveParam, unquote, parseThemeStyle, findParam } from '../tools';
import { Options } from '../watcher';

/**
 * Parses style parameters generated from CSS, and transforms them into widget parameters
 * @param widget the widget and descendants to process
 * @param options the flutter-view options
 */
export function transformWidget(widget: Widget, options: Options): Widget {
	
	const styleParam = findAndRemoveParam(widget, 'style', {
		includeExpressions: false,
		includeResolved: true
	})

	if(styleParam && styleParam.value) {
		const style = styleParam.value as string
		const styleRules = styleparser(style)
		for(const attr in styleRules) {
			let name: string = attr
			if(findParam(widget, name, true)) continue
			let value: string = styleRules[attr]
			let type: 'expression' | 'literal' = 'literal'
			if(attr.startsWith(':')) {
				type = 'expression'
				name = attr.substring(1)
			}
			if(unquote(value).startsWith(':')) {
				type = 'expression'
				value = unquote(value).substring(1)
			}
			// const themeStyle = parseThemeStyle(unquote(value))
			// if(themeStyle) {
			// 	type = 'expression'
			// 	value = themeStyle
			// }
			let resolved = false
			if(value.startsWith('^')) {
				resolved = true
				value = value.substring(1)
			}
			value = value.replace(' [', '[') // css adds space between name and block bracket
			widget.params.push({
				class: 'param',
				type: type,
				name: (name=='value') ? undefined : camelCase(name),
				value: attr!=value ? decode(value) : true, // pug renders empty attributes as key==value
				resolved: resolved
			})
		}
	}

	// also apply the plugin to the rest of the widget tree of this widget
	applyOnDescendants(widget, descendant=>transformWidget(descendant, options))

	return widget
}
