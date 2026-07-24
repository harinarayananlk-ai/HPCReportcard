const fs = require('fs');
const path = require('path');

const modulePath = path.join(__dirname, '../node_modules/react-native-svg/lib/module/web/WebShape.js');
const commonjsPath = path.join(__dirname, '../node_modules/react-native-svg/lib/commonjs/web/WebShape.js');

const moduleContent = `function safeAssignStyle(targetStyle, styleProp) {
  if (!styleProp) return;
  if (Array.isArray(styleProp)) {
    for (const item of styleProp) {
      safeAssignStyle(targetStyle, item);
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
// @ts-ignore it is not seen in exports
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

  /**
   * disclaimer: I am not sure why the props are wrapped in a \`style\` attribute here, but that's how reanimated calls it
   */
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
            safeAssignStyle(current.style, clean.style);
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
            current.setAttribute(camelCaseToDashed(cleanAttribute), cleanValue);
            break;
        }
      }
    }
  }
  constructor(props) {
    super(props);

    // Do not attach touchable mixin handlers if SVG element doesn't have a touchable prop
    if (hasTouchableProperty(props)) {
      SvgTouchableMixin(this);
    }
    this._remeasureMetricsOnActivation = remeasure.bind(this);
  }
  render() {
    if (!this.tag) {
      throw new Error('When extending \`WebShape\` you need to overwrite either \`tag\` or \`render\`!');
    }
    this.lastMergedProps = {};
    return createElement(this.tag, prepare(this, this.prepareProps(this.props)));
  }
}
//# sourceMappingURL=WebShape.js.map
`;

const commonjsContent = `"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
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
  if (!styleProp) return;
  if (Array.isArray(styleProp)) {
    for (const item of styleProp) {
      safeAssignStyle(targetStyle, item);
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

  /**
   * disclaimer: I am not sure why the props are wrapped in a \`style\` attribute here, but that's how reanimated calls it
   */
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
            safeAssignStyle(current.style, clean.style);
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
            current.setAttribute((0, _utils.camelCaseToDashed)(cleanAttribute), cleanValue);
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
      throw new Error('When extending \`WebShape\` you need to overwrite either \`tag\` or \`render\`!');
    }
    this.lastMergedProps = {};
    return (0, _reactNative.unstable_createElement)(this.tag, (0, _prepare.prepare)(this, this.prepareProps(this.props)));
  }
}
exports.WebShape = WebShape;
//# sourceMappingURL=WebShape.js.map
`;

fs.writeFileSync(modulePath, moduleContent, 'utf8');
fs.writeFileSync(commonjsPath, commonjsContent, 'utf8');
console.log('Successfully written clean WebShape files!');
