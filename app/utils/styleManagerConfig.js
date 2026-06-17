// utils/styleManagerConfig.js
// Mirrors the styleManager.sectors config from the original Phalcon view

import { FONTS } from './fonts';

export function getStyleManagerSectors() {
  return [
    {
      name: 'General',
      properties: [
        {
          property: 'display',
          name: 'Display',
          type: 'select',
          options: [
            { name: 'select', value: '', style: 'display:none;' },
            { name: 'block', value: 'block' },
            { name: 'inline', value: 'inline' },
            { name: 'inline-block', value: 'inline-block' },
            { name: 'flex', value: 'flex' },
            { name: 'none', value: 'none' },
          ],
        },
        {
          property: 'position',
          name: 'Position',
          type: 'select',
          options: [
            { name: 'select', value: '', style: 'display:none;' },
            { name: 'static', value: 'static' },
            { name: 'relative', value: 'relative' },
            { name: 'absolute', value: 'absolute' },
            { name: 'fixed', value: 'fixed' },
          ],
        },
        'top', 'right', 'left', 'bottom',
      ],
    },
    {
      name: 'Dimension',
      open: false,
      properties: [
        'width', 'height', 'max-width', 'max-height',
        'min-width', 'min-height', 'margin', 'padding',
      ],
    },
    {
      name: 'Typography',
      open: false,
      buildProps: ['font-family', 'font-size', 'letter-spacing'],
      properties: [
        {
          property: 'font-family',
          name: 'Font',
          default: '',
          list: FONTS,
        },
        {
          property: 'font-weight',
          name: 'Font Weight',
          type: 'select',
          options: [
            { name: 'select', value: '', style: 'display:none;' },
            { name: 'Thin', value: '100' },
            { name: 'Extra-Light', value: '200' },
            { name: 'Light', value: '300' },
            { name: 'Normal', value: '400' },
            { name: 'Medium', value: '500' },
            { name: 'Semi-Bold', value: '600' },
            { name: 'Bold', value: '700' },
            { name: 'Extra-Bold', value: '800' },
            { name: 'Ultra-Bold', value: '900' },
          ],
        },
        'color',
        {
          property: 'text-decoration',
          type: 'radio',
          options: [
            { id: 'none', label: 'None', className: 'fa fa-times' },
            { id: 'underline', label: 'underline', className: 'fa fa-underline' },
            { id: 'line-through', label: 'Line-through', className: 'fa fa-strikethrough' },
          ],
        },
        'line-height',
        {
          property: 'text-transform',
          name: 'Text Transform',
          type: 'select',
          options: [
            { name: 'select', value: '', style: 'display:none;' },
            { name: 'capitalize', value: 'capitalize' },
            { name: 'uppercase', value: 'uppercase' },
            { name: 'lowercase', value: 'lowercase' },
            { name: 'none', value: 'none' },
          ],
        },
        {
          property: 'text-align',
          name: 'Text align',
          type: 'select',
          options: [
            { name: 'select', value: '', style: 'display:none;' },
            { name: 'left', value: 'left' },
            { name: 'center', value: 'center' },
            { name: 'right', value: 'right' },
            { name: 'justify', value: 'justify' },
          ],
        },
        {
          property: 'vertical-align',
          name: 'Vertical align',
          type: 'select',
          options: [
            { name: 'select', value: '', style: 'display:none;' },
            { name: 'baseline', value: 'baseline' },
            { name: 'top', value: 'top' },
            { name: 'middle', value: 'middle' },
            { name: 'bottom', value: 'bottom' },
            { name: 'sub', value: 'sub' },
            { name: 'text-top', value: 'text-top' },
          ],
        },
        'text-shadow',
      ],
    },
    {
      name: 'Decorations',
      open: false,
      properties: [
        'opacity',
        'border-radius',
        'border',
        { name: 'Background color', property: 'background-color', type: 'color' },
        'box-shadow',
        'background',
      ],
    },
    {
      name: 'Extra',
      open: false,
      buildProps: ['transition', 'perspective', 'transform', 'z-index'],
      properties: [
        {
          property: 'float',
          type: 'radio',
          options: [
            { value: 'none', className: 'fa fa-times' },
            { value: 'left', className: 'fa fa-align-left' },
            { value: 'right', className: 'fa fa-align-right' },
          ],
        },
        {
          property: 'object-fit',
          name: 'object fit',
          type: 'select',
          options: [
            { name: 'select', value: '', style: 'display:none;' },
            { value: 'fill', name: 'fill' },
            { value: 'contain', name: 'contain' },
            { value: 'cover', name: 'cover' },
            { value: 'none', name: 'none' },
            { value: 'scale-down', name: 'scale-down' },
          ],
        },
      ],
    },
    {
      name: 'Flex',
      open: false,
      properties: [
        {
          name: 'Flex Container',
          property: 'display',
          type: 'select',
          list: [
            { name: 'select', value: '', style: 'display:none;' },
            { value: 'block', name: 'Disable' },
            { value: 'flex', name: 'Enable' },
          ],
        },
        {
          name: 'Direction',
          property: 'flex-direction',
          type: 'select',
          list: [
            { name: 'select', value: '', style: 'display:none;' },
            { value: 'row', name: 'Row' },
            { value: 'row-reverse', name: 'Row reverse' },
            { value: 'column', name: 'Column' },
            { value: 'column-reverse', name: 'Column reverse' },
          ],
        },
        {
          name: 'Justify',
          property: 'justify-content',
          type: 'select',
          list: [
            { name: 'select', value: '', style: 'display:none;' },
            { value: 'flex-start', name: 'Start' },
            { value: 'flex-end', name: 'End' },
            { value: 'space-between', name: 'Space between' },
            { value: 'space-around', name: 'Space around' },
            { value: 'center', name: 'Center' },
          ],
        },
        {
          name: 'Align Items',
          property: 'align-items',
          type: 'select',
          list: [
            { name: 'select', value: '', style: 'display:none;' },
            { value: 'flex-start', name: 'Start' },
            { value: 'flex-end', name: 'End' },
            { value: 'stretch', name: 'Stretch' },
            { value: 'center', name: 'Center' },
          ],
        },
        {
          name: 'Align Self',
          property: 'align-self',
          type: 'select',
          list: [
            { name: 'select', value: '', style: 'display:none;' },
            { value: 'auto', name: 'Auto' },
            { value: 'flex-start', name: 'Start' },
            { value: 'flex-end', name: 'End' },
            { value: 'stretch', name: 'Stretch' },
            { value: 'center', name: 'Center' },
          ],
        },
        { name: 'Flex Basis', property: 'flex-basis', type: 'integer', units: ['px', '%', ''], unit: '' },
        { name: 'Flex Grow', property: 'flex-grow', type: 'integer', min: 0 },
        { name: 'Flex Shrink', property: 'flex-shrink', type: 'integer', min: 0 },
        { name: 'Flex Row Gap', property: 'row-gap', type: 'integer', units: ['px', '%', ''], unit: 'px' },
        { name: 'Flex Column Gap', property: 'column-gap', type: 'integer', units: ['px', '%', ''], unit: 'px' },
        { name: 'Order', property: 'order', type: 'integer', min: 0 },
      ],
    },
  ];
}
