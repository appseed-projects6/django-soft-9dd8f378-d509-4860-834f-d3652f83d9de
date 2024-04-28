'use client';

import _extends from "@babel/runtime/helpers/esm/extends";
import _formatMuiErrorMessage from "@mui/utils/formatMuiErrorMessage";
import * as React from 'react';
import { unstable_useForkRef as useForkRef, unstable_useId as useId } from '@mui/utils';
import { extractEventHandlers } from '../utils/extractEventHandlers';
import { useControllableReducer } from '../utils/useControllableReducer';
import { useFormControlContext } from '../FormControl';
import { NumberInputActionTypes } from './numberInputAction.types';
import { numberInputReducer } from './numberInputReducer';
import { isNumber } from './utils';
const STEP_KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'];
const SUPPORTED_KEYS = [...STEP_KEYS, 'Home', 'End'];
export function getInputValueAsString(v) {
  return v ? String(v.trim()) : String(v);
}

/**
 *
 * Demos:
 *
 * - [Number Input](https://mui.com/base-ui/react-number-input/#hook)
 *
 * API:
 *
 * - [useNumberInput API](https://mui.com/base-ui/react-number-input/hooks-api/#use-number-input)
 */
export function useNumberInput(parameters) {
  var _ref;
  const {
    min,
    max,
    step,
    shiftMultiplier = 10,
    defaultValue: defaultValueProp,
    disabled: disabledProp = false,
    error: errorProp = false,
    onBlur,
    onInputChange,
    onFocus,
    onChange,
    required: requiredProp = false,
    readOnly: readOnlyProp = false,
    value: valueProp,
    inputRef: inputRefProp,
    inputId: inputIdProp,
    componentName = 'useNumberInput'
  } = parameters;

  // TODO: make it work with FormControl
  const formControlContext = useFormControlContext();
  const {
    current: isControlled
  } = React.useRef(valueProp != null);
  const handleInputRefWarning = React.useCallback(instance => {
    if (process.env.NODE_ENV !== 'production') {
      if (instance && instance.nodeName !== 'INPUT' && !instance.focus) {
        console.error(['MUI: You have provided a `slots.input` to the input component', 'that does not correctly handle the `ref` prop.', 'Make sure the `ref` prop is called with a HTMLInputElement.'].join('\n'));
      }
    }
  }, []);
  const inputRef = React.useRef(null);
  const handleInputRef = useForkRef(inputRef, inputRefProp, handleInputRefWarning);
  const inputId = useId(inputIdProp);
  const [focused, setFocused] = React.useState(false);
  const handleStateChange = React.useCallback((event, field, fieldValue, reason) => {
    if (field === 'value' && typeof fieldValue !== 'string') {
      switch (reason) {
        // only a blur event will dispatch `numberInput:clamp`
        case 'numberInput:clamp':
          onChange == null || onChange(event, fieldValue);
          break;
        case 'numberInput:increment':
        case 'numberInput:decrement':
        case 'numberInput:incrementToMax':
        case 'numberInput:decrementToMin':
          onChange == null || onChange(event, fieldValue);
          break;
        default:
          break;
      }
    }
  }, [onChange]);
  const numberInputActionContext = React.useMemo(() => {
    return {
      min,
      max,
      step,
      shiftMultiplier,
      getInputValueAsString
    };
  }, [min, max, step, shiftMultiplier]);
  const initialValue = (_ref = valueProp != null ? valueProp : defaultValueProp) != null ? _ref : null;
  const initialState = {
    value: initialValue,
    inputValue: initialValue ? String(initialValue) : ''
  };
  const controlledState = React.useMemo(() => ({
    value: valueProp
  }), [valueProp]);
  const [state, dispatch] = useControllableReducer({
    reducer: numberInputReducer,
    controlledProps: controlledState,
    initialState,
    onStateChange: handleStateChange,
    actionContext: React.useMemo(() => numberInputActionContext, [numberInputActionContext]),
    componentName
  });
  const {
    value,
    inputValue
  } = state;
  React.useEffect(() => {
    if (!formControlContext && disabledProp && focused) {
      setFocused(false);
      onBlur == null || onBlur();
    }
  }, [formControlContext, disabledProp, focused, onBlur]);
  React.useEffect(() => {
    if (isControlled && isNumber(value)) {
      dispatch({
        type: NumberInputActionTypes.resetInputValue
      });
    }
  }, [value, dispatch, isControlled]);
  const createHandleFocus = otherHandlers => event => {
    var _otherHandlers$onFocu;
    (_otherHandlers$onFocu = otherHandlers.onFocus) == null || _otherHandlers$onFocu.call(otherHandlers, event);
    if (event.defaultMuiPrevented || event.defaultPrevented) {
      return;
    }
    if (formControlContext && formControlContext.onFocus) {
      var _formControlContext$o;
      formControlContext == null || (_formControlContext$o = formControlContext.onFocus) == null || _formControlContext$o.call(formControlContext);
    }
    setFocused(true);
  };
  const createHandleInputChange = otherHandlers => event => {
    var _formControlContext$o2, _otherHandlers$onInpu;
    if (!isControlled && event.target === null) {
      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: Expected valid input target. Did you use a custom \`slots.input\` and forget to forward refs? See https://mui.com/r/input-component-ref-interface for more info.` : _formatMuiErrorMessage(17));
    }
    formControlContext == null || (_formControlContext$o2 = formControlContext.onChange) == null || _formControlContext$o2.call(formControlContext, event);
    (_otherHandlers$onInpu = otherHandlers.onInputChange) == null || _otherHandlers$onInpu.call(otherHandlers, event);
    if (event.defaultMuiPrevented || event.defaultPrevented) {
      return;
    }
    dispatch({
      type: NumberInputActionTypes.inputChange,
      event,
      inputValue: event.currentTarget.value
    });
  };
  const createHandleBlur = otherHandlers => event => {
    var _otherHandlers$onBlur;
    formControlContext == null || formControlContext.onBlur();
    (_otherHandlers$onBlur = otherHandlers.onBlur) == null || _otherHandlers$onBlur.call(otherHandlers, event);
    if (event.defaultMuiPrevented || event.defaultPrevented) {
      return;
    }
    dispatch({
      type: NumberInputActionTypes.clamp,
      event,
      inputValue: event.currentTarget.value
    });
    setFocused(false);
  };
  const createHandleClick = otherHandlers => event => {
    var _otherHandlers$onClic;
    (_otherHandlers$onClic = otherHandlers.onClick) == null || _otherHandlers$onClic.call(otherHandlers, event);
    if (event.defaultMuiPrevented || event.defaultPrevented) {
      return;
    }
    if (inputRef.current && event.currentTarget === event.target) {
      inputRef.current.focus();
    }
  };
  const handleStep = direction => event => {
    const applyMultiplier = Boolean(event.shiftKey);
    const actionType = {
      up: NumberInputActionTypes.increment,
      down: NumberInputActionTypes.decrement
    }[direction];
    dispatch({
      type: actionType,
      event,
      applyMultiplier
    });
  };
  const createHandleKeyDown = otherHandlers => event => {
    var _otherHandlers$onKeyD;
    (_otherHandlers$onKeyD = otherHandlers.onKeyDown) == null || _otherHandlers$onKeyD.call(otherHandlers, event);
    if (event.defaultMuiPrevented || event.defaultPrevented) {
      return;
    }

    // this prevents unintended page scrolling
    if (SUPPORTED_KEYS.includes(event.key)) {
      event.preventDefault();
    }
    switch (event.key) {
      case 'ArrowUp':
        dispatch({
          type: NumberInputActionTypes.increment,
          event,
          applyMultiplier: !!event.shiftKey
        });
        break;
      case 'ArrowDown':
        dispatch({
          type: NumberInputActionTypes.decrement,
          event,
          applyMultiplier: !!event.shiftKey
        });
        break;
      case 'PageUp':
        dispatch({
          type: NumberInputActionTypes.increment,
          event,
          applyMultiplier: true
        });
        break;
      case 'PageDown':
        dispatch({
          type: NumberInputActionTypes.decrement,
          event,
          applyMultiplier: true
        });
        break;
      case 'Home':
        dispatch({
          type: NumberInputActionTypes.incrementToMax,
          event
        });
        break;
      case 'End':
        dispatch({
          type: NumberInputActionTypes.decrementToMin,
          event
        });
        break;
      default:
        break;
    }
  };
  const getRootProps = (externalProps = {}) => {
    const propsEventHandlers = extractEventHandlers(parameters, [
    // these are handled by the input slot
    'onBlur', 'onInputChange', 'onFocus', 'onChange']);
    const externalEventHandlers = _extends({}, propsEventHandlers, extractEventHandlers(externalProps));
    return _extends({}, externalProps, externalEventHandlers, {
      onClick: createHandleClick(externalEventHandlers)
    });
  };
  const getInputProps = (externalProps = {}) => {
    var _ref2;
    const propsEventHandlers = {
      onBlur,
      onFocus,
      // onChange from normal props is the custom onChange so we ignore it here
      onChange: onInputChange
    };
    const externalEventHandlers = _extends({}, propsEventHandlers, extractEventHandlers(externalProps, [
    // onClick is handled by the root slot
    'onClick'
    // do not ignore 'onInputChange', we want slotProps.input.onInputChange to enter the DOM and throw
    ]));
    const mergedEventHandlers = _extends({}, externalEventHandlers, {
      onFocus: createHandleFocus(externalEventHandlers),
      // slotProps.onChange is renamed to onInputChange and passed to createHandleInputChange
      onChange: createHandleInputChange(_extends({}, externalEventHandlers, {
        onInputChange: externalEventHandlers.onChange
      })),
      onBlur: createHandleBlur(externalEventHandlers),
      onKeyDown: createHandleKeyDown(externalEventHandlers)
    });
    const displayValue = (_ref2 = focused ? inputValue : value) != null ? _ref2 : '';

    // get rid of slotProps.input.onInputChange before returning to prevent it from entering the DOM
    // if it was passed, it will be in mergedEventHandlers and throw
    delete externalProps.onInputChange;
    return _extends({
      type: 'text',
      id: inputId,
      'aria-invalid': errorProp || undefined,
      defaultValue: undefined,
      value: displayValue,
      'aria-valuenow': displayValue,
      'aria-valuetext': String(displayValue),
      'aria-valuemin': min,
      'aria-valuemax': max,
      autoComplete: 'off',
      autoCorrect: 'off',
      spellCheck: 'false',
      required: requiredProp,
      readOnly: readOnlyProp,
      'aria-disabled': disabledProp,
      disabled: disabledProp
    }, externalProps, {
      ref: handleInputRef
    }, mergedEventHandlers);
  };
  const handleStepperButtonMouseDown = event => {
    event.preventDefault();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  const stepperButtonCommonProps = {
    'aria-controls': inputId,
    tabIndex: -1
  };
  const isIncrementDisabled = disabledProp || (isNumber(value) ? value >= (max != null ? max : Number.MAX_SAFE_INTEGER) : false);
  const getIncrementButtonProps = (externalProps = {}) => {
    return _extends({}, externalProps, stepperButtonCommonProps, {
      disabled: isIncrementDisabled,
      'aria-disabled': isIncrementDisabled,
      onMouseDown: handleStepperButtonMouseDown,
      onClick: handleStep('up')
    });
  };
  const isDecrementDisabled = disabledProp || (isNumber(value) ? value <= (min != null ? min : Number.MIN_SAFE_INTEGER) : false);
  const getDecrementButtonProps = (externalProps = {}) => {
    return _extends({}, externalProps, stepperButtonCommonProps, {
      disabled: isDecrementDisabled,
      'aria-disabled': isDecrementDisabled,
      onMouseDown: handleStepperButtonMouseDown,
      onClick: handleStep('down')
    });
  };
  return {
    disabled: disabledProp,
    error: errorProp,
    focused,
    formControlContext,
    getInputProps,
    getIncrementButtonProps,
    getDecrementButtonProps,
    getRootProps,
    required: requiredProp,
    value,
    inputValue,
    isIncrementDisabled,
    isDecrementDisabled
  };
}