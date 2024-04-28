import * as React from 'react';

/**
 * Gets only the valid children of a component,
 * and ignores any nullish or falsy child.
 *
 * @param children the children
 */
export default function getValidReactChildren(children) {
  return React.Children.toArray(children).filter(child => /*#__PURE__*/React.isValidElement(child));
}