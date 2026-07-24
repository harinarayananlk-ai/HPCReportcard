const fs = require('fs');
const path = require('path');

// 1. Patch react-native-svg WebShape
const svgModulePath = path.join(__dirname, '../node_modules/react-native-svg/lib/module/web/WebShape.js');
const svgCommonjsPath = path.join(__dirname, '../node_modules/react-native-svg/lib/commonjs/web/WebShape.js');

const svgModuleContent = `function safeAssignStyle(targetStyle, styleProp) {
  if (!styleProp || !targetStyle) return;
  if (Array.isArray(styleProp)) {
    for (let i = 0; i < styleProp.length; i++) {
      safeAssignStyle(targetStyle, styleProp[i]);
    }
  } else if (typeof styleProp === 'object') {
    for (const key of Object.keys(styleProp)) {
      if (isNaN(Number(key))) {
        try {
          targetStyle[key] = styleProp[key];
        } catch (e) {}
      }
    }
  }
}
import React from 'react';
import {
  unstable_createElement as createElement } from 'react-native';
import { prepare } from './utils/prepare';
import { convertInt32ColorToRGBA } from './utils/convertInt32Color';
import { camelCaseToDashed, remeasure } from './utils';
import { hasTouchableProperty } from './utils/hasProperty';
import SvgTouchableMixin from '../lib/SvgTouchableMixin';

export class WebShape extends React.Component {
  prepareProps(props) {
    return props;
  }
  elementRef = /*#__PURE__*/React.createRef();
  lastMergedProps = {};

  setNativeProps(props) {
    let styleObj = {};
    if (props && props.style) {
      safeAssignStyle(styleObj, props.style);
    }
    const merged = Object.assign({}, this.props, this.lastMergedProps, styleObj);
    for (const k of Object.keys(merged)) {
      if (!isNaN(Number(k))) {
        delete merged[k];
      }
    }
    this.lastMergedProps = merged;
    const clean = prepare(this, this.prepareProps(merged));
    const current = this.elementRef.current;
    if (current) {
      for (const cleanAttribute of Object.keys(clean)) {
        if (!isNaN(Number(cleanAttribute))) continue;
        const cleanValue = clean[cleanAttribute];
        switch (cleanAttribute) {
          case 'ref':
          case 'children':
            break;
          case 'style':
            if (current.style) {
              safeAssignStyle(current.style, clean.style);
            }
            break;
          case 'fill':
            if (cleanValue && typeof cleanValue === 'object') {
              const value = cleanValue;
              current.setAttribute('fill', convertInt32ColorToRGBA(value.payload));
            }
            break;
          case 'stroke':
            if (cleanValue && typeof cleanValue === 'object') {
              const value = cleanValue;
              current.setAttribute('stroke', convertInt32ColorToRGBA(value.payload));
            }
            break;
          default:
            try {
              current.setAttribute(camelCaseToDashed(cleanAttribute), cleanValue);
            } catch(e) {}
            break;
        }
      }
    }
  }
  constructor(props) {
    super(props);
    if (hasTouchableProperty(props)) {
      SvgTouchableMixin(this);
    }
    this._remeasureMetricsOnActivation = remeasure.bind(this);
  }
  render() {
    if (!this.tag) {
      throw new Error('When extending WebShape you need to overwrite either tag or render!');
    }
    this.lastMergedProps = {};
    return createElement(this.tag, prepare(this, this.prepareProps(this.props)));
  }
}
`;

const svgCommonjsContent = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebShape = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _prepare = require("./utils/prepare");
var _convertInt32Color = require("./utils/convertInt32Color");
var _utils = require("./utils");
var _hasProperty = require("./utils/hasProperty");
var _SvgTouchableMixin = _interopRequireDefault(require("../lib/SvgTouchableMixin"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }

function safeAssignStyle(targetStyle, styleProp) {
  if (!styleProp || !targetStyle) return;
  if (Array.isArray(styleProp)) {
    for (let i = 0; i < styleProp.length; i++) {
      safeAssignStyle(targetStyle, styleProp[i]);
    }
  } else if (typeof styleProp === 'object') {
    for (const key of Object.keys(styleProp)) {
      if (isNaN(Number(key))) {
        try {
          targetStyle[key] = styleProp[key];
        } catch (e) {}
      }
    }
  }
}

class WebShape extends _react.default.Component {
  prepareProps(props) {
    return props;
  }
  elementRef = /*#__PURE__*/_react.default.createRef();
  lastMergedProps = {};

  setNativeProps(props) {
    let styleObj = {};
    if (props && props.style) {
      safeAssignStyle(styleObj, props.style);
    }
    const merged = Object.assign({}, this.props, this.lastMergedProps, styleObj);
    for (const k of Object.keys(merged)) {
      if (!isNaN(Number(k))) {
        delete merged[k];
      }
    }
    this.lastMergedProps = merged;
    const clean = (0, _prepare.prepare)(this, this.prepareProps(merged));
    const current = this.elementRef.current;
    if (current) {
      for (const cleanAttribute of Object.keys(clean)) {
        if (!isNaN(Number(cleanAttribute))) continue;
        const cleanValue = clean[cleanAttribute];
        switch (cleanAttribute) {
          case 'ref':
          case 'children':
            break;
          case 'style':
            if (current.style) {
              safeAssignStyle(current.style, clean.style);
            }
            break;
          case 'fill':
            if (cleanValue && typeof cleanValue === 'object') {
              const value = cleanValue;
              current.setAttribute('fill', (0, _convertInt32Color.convertInt32ColorToRGBA)(value.payload));
            }
            break;
          case 'stroke':
            if (cleanValue && typeof cleanValue === 'object') {
              const value = cleanValue;
              current.setAttribute('stroke', (0, _convertInt32Color.convertInt32ColorToRGBA)(value.payload));
            }
            break;
          default:
            try {
              current.setAttribute((0, _utils.camelCaseToDashed)(cleanAttribute), cleanValue);
            } catch(e) {}
            break;
        }
      }
    }
  }
  constructor(props) {
    super(props);
    if ((0, _hasProperty.hasTouchableProperty)(props)) {
      (0, _SvgTouchableMixin.default)(this);
    }
    this._remeasureMetricsOnActivation = _utils.remeasure.bind(this);
  }
  render() {
    if (!this.tag) {
      throw new Error('When extending WebShape you need to overwrite either tag or render!');
    }
    this.lastMergedProps = {};
    return (0, _reactNative.unstable_createElement)(this.tag, (0, _prepare.prepare)(this, this.prepareProps(this.props)));
  }
}
exports.WebShape = WebShape;
`;

if (fs.existsSync(svgModulePath)) fs.writeFileSync(svgModulePath, svgModuleContent, 'utf8');
if (fs.existsSync(svgCommonjsPath)) fs.writeFileSync(svgCommonjsPath, svgCommonjsContent, 'utf8');

// 2. Patch react-native-reanimated js-reanimated index.js
const reanimatedModulePath = path.join(__dirname, '../node_modules/react-native-reanimated/lib/module/ReanimatedModule/js-reanimated/index.js');
const reanimatedCommonjsPath = path.join(__dirname, '../node_modules/react-native-reanimated/lib/commonjs/ReanimatedModule/js-reanimated/index.js');

const reanimatedModuleContent = `'use strict';
import { logger } from '../../common';
import { createReactDOMStyle, createTextShadowValue, createTransformValue } from './webUtils';
export { createJSReanimatedModule } from './JSReanimated';

export const _updatePropsJS = (updates, viewRef, isAnimatedProps) => {
  if (viewRef) {
    const component = viewRef.getAnimatableRef ? viewRef.getAnimatableRef() : viewRef;
    const [rawStyles] = Object.keys(updates).reduce((acc, key) => {
      if (!isNaN(Number(key))) return acc;
      const value = updates[key];
      const index = typeof value === 'function' ? 1 : 0;
      acc[index][key] = value;
      return acc;
    }, [{}, {}]);
    if (typeof component.setNativeProps === 'function') {
      setNativeProps(component, rawStyles, isAnimatedProps);
    } else if (createReactDOMStyle !== undefined && component.style !== undefined) {
      updatePropsDOM(component, rawStyles, isAnimatedProps);
    } else if (component.props && Object.keys(component.props).length > 0) {
      Object.keys(component.props).forEach(key => {
        if (!isNaN(Number(key)) || !rawStyles[key]) return;
        const dashedKey = key.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
        try { component._touchableNode?.setAttribute(dashedKey, rawStyles[key]); } catch (e) {}
      });
    }
  }
};

const setNativeProps = (component, newProps, isAnimatedProps) => {
  const cleanProps = {};
  if (newProps && typeof newProps === 'object') {
    for (const k of Object.keys(newProps)) {
      if (isNaN(Number(k))) {
        cleanProps[k] = newProps[k];
      }
    }
  }
  if (isAnimatedProps) {
    try { component.setNativeProps?.(cleanProps); } catch (e) {}
  }
  const previousStyle = component.previousStyle ? component.previousStyle : {};
  const currentStyle = {
    ...previousStyle,
    ...cleanProps
  };
  component.previousStyle = currentStyle;
  try {
    component.setNativeProps?.({
      style: currentStyle
    });
  } catch (e) {}
};

const updatePropsDOM = (component, style, isAnimatedProps) => {
  const previousStyle = component.previousStyle ? component.previousStyle : {};
  const currentStyle = {
    ...previousStyle,
    ...style
  };
  component.previousStyle = currentStyle;
  const domStyle = createReactDOMStyle(currentStyle);
  if (Array.isArray(domStyle.transform) && createTransformValue !== undefined) {
    domStyle.transform = createTransformValue(domStyle.transform);
  }
  if (createTextShadowValue !== undefined && (domStyle.textShadowColor || domStyle.textShadowRadius || domStyle.textShadowOffset)) {
    domStyle.textShadow = createTextShadowValue({
      textShadowColor: domStyle.textShadowColor,
      textShadowOffset: domStyle.textShadowOffset,
      textShadowRadius: domStyle.textShadowRadius
    });
  }
  for (const key in domStyle) {
    if (!isNaN(Number(key))) continue;
    if (isAnimatedProps) {
      if (component.nodeName === 'INPUT' && key === 'text') {
        component.value = domStyle[key];
      } else {
        try { component.setAttribute(key, domStyle[key]); } catch (e) {}
      }
    } else {
      try { component.style[key] = domStyle[key]; } catch (e) {}
    }
  }
};
`;

if (fs.existsSync(reanimatedModulePath)) fs.writeFileSync(reanimatedModulePath, reanimatedModuleContent, 'utf8');

console.log('Successfully applied web SVG & Reanimated patches!');
