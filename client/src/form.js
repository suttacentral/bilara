/* This code from https://www.learnwithjason.dev/blog/get-form-values-as-json/ */

/**
 * Checks that an element has a non-empty `name` and `value` property.
 * @param  {Element} element  the element to check
 * @return {Bool}             true if the element is an input, false if not
 */
const isValidElement = element => {
  return element.name && element.value;
};

/**
 * Checks if an element’s value can be saved (e.g. not an unselected checkbox).
 * @param  {Element} element  the element to check
 * @return {Boolean}          true if the value should be added, false if not
 */
const isValidValue = element => {
  return !element.disabled && (!['checkbox', 'radio'].includes(element.type) || element.checked);
};

/**
 * Checks if an input is a checkbox, because checkboxes allow multiple values.
 * @param  {Element} element  the element to check
 * @return {Boolean}          true if the element is a checkbox, false if not
 */
const isCheckbox = element => element.type === 'checkbox';

/**
 * Checks if an input is a `select` with the `multiple` attribute.
 * @param  {Element} element  the element to check
 * @return {Boolean}          true if the element is a multiselect, false if not
 */
const isMultiSelect = element => element.options && element.multiple;

/**
 * Retrieves the selected options from a multi-select as an array.
 * @param  {HTMLOptionsCollection} options  the options for the select
 * @return {Array}                          an array of selected option values
 */
const getSelectValues = options => [].reduce.call(options, (values, option) => {
  return option.selected ? values.concat(option.value) : values;
}, []);

/**
 * A more verbose implementation of `formToJSON()` to explain how it works.
 *
 * NOTE: This function is unused, and is only here for the purpose of explaining how
 * reducing form elements works.
 *
 * @param  {HTMLFormControlsCollection} elements  the form elements
 * @return {Object}                               form data as an object literal
 */
const formToJSON_deconstructed = elements => {
  
  // This is the function that is called on each element of the array.
  const reducerFunction = (data, element) => {
    
    // Add the current field to the object.
    data[element.name] = element.value;
    
    // For the demo only: show each step in the reducer’s progress.
    console.log(JSON.stringify(data));

    return data;
  };
  
  // This is used as the initial value of `data` in `reducerFunction()`.
  const reducerInitialValue = {};
  
  // To help visualize what happens, log the inital value, which we know is `{}`.
  console.log('Initial `data` value:', JSON.stringify(reducerInitialValue));
  
  // Now we reduce by `call`-ing `Array.prototype.reduce()` on `elements`.
  const formData = [].reduce.call(elements, reducerFunction, reducerInitialValue);
  
  // The result is then returned for use elsewhere.
  return formData;
};

/**
 * Retrieves input data from a form and returns it as a JSON object.
 * @param  {HTMLFormControlsCollection} elements  the form elements
 * @return {Object}                               form data as an object literal
 */
export const formToJSON = elements => [].reduce.call(elements, (data, element) => {

  // Make sure the element has the required properties and should be added.
  if (isValidElement(element) && isValidValue(element)) {

    /*
     * Some fields allow for more than one value, so we need to check if this
     * is one of those fields and, if so, store the values as an array.
     */
    if (isCheckbox(element)) {
      data[element.name] = (data[element.name] || []).concat(element.value);
    } else if (isMultiSelect(element)) {
      data[element.name] = getSelectValues(element);
    } else {
      data[element.name] = element.value;
    }
  }

  return data;
}, {});

/**
 * A handler function to prevent default submission and run our custom script.
 * @param  {Event} event  the submit event triggered by the user
 * @return {void}
 */

 /*
export const handleFormSubmit = event => {
  
  // Stop the form from submitting since we’re handling that with AJAX.
  event.preventDefault();
  
  // Call our function to get the form data.
  const data = formToJSON(form.elements);

  // Demo only: print the form data onscreen as a formatted JSON object.
  const dataContainer = document.getElementsByClassName('results__display')[0];
  
  // Use `JSON.stringify()` to make the output valid, human-readable JSON.
  dataContainer.textContent = JSON.stringify(data, null, "  ");
  
  // ...this is where we’d actually do something with the form data...
};
*/

/*
 * This is where things actually get started. We find the form element using
 * its class name, then attach the `handleFormSubmit()` function to the 
 * `submit` event.
 */

 /*
const form = document.getElementsByClassName('contact-form')[0];
form.addEventListener('submit', handleFormSubmit);
*/



if (!self.define) {
  const e = e => {
          "require" !== e && (e += ".js");
          let r = Promise.resolve();
          return f[e] || (r = new Promise(async r => {
              if ("document" in self) {
                  const f = document.createElement("script");
                  f.src = e, document.head.appendChild(f), f.onload = r
              } else importScripts(e), r()
          })), r.then(() => {
              if (!f[e]) throw new Error(`Module ${e} didn’t register its module`);
              return f[e]
          })
      },
      r = (r, f) => {
          Promise.all(r.map(e)).then(e => f(1 === e.length ? e[0] : e))
      },
      f = {
          require: Promise.resolve(r)
      };
  self.define = (r, s, i) => {
      f[r] || (f[r] = Promise.resolve().then(() => {
          let f = {};
          const c = {
              uri: location.origin + r.slice(1)
          };
          return Promise.all(s.map(r => {
              switch (r) {
                  case "exports":
                      return f;
                  case "module":
                      return c;
                  default:
                      return e(r)
              }
          })).then(e => {
              const r = i(...e);
              return f.default || (f.default = r), f
          })
      }))
  }
}
define("./sw.js", ["./workbox-18e9e952"], (function(e) {
  "use strict";
  e.skipWaiting(), e.clientsClaim(), e.precacheAndRoute([{
      url: "0b5683d9.js",
      revision: "38ff7366801c750fbbdf014dfdf51ec1"
  }, {
      url: "0baf422c.js",
      revision: "3a916e0348a553df23872e0d60e3356b"
  }, {
      url: "25109537.js",
      revision: "90a8fc07dc9d443a58e72f73859b9b35"
  }, {
      url: "292cb48a.js",
      revision: "7825f27cd6adec6b41e63e6c09a7a36b"
  }, {
      url: "3e2ae9b7.js",
      revision: "54af4cc71fef1ae196fc2c4518092a58"
  }, {
      url: "43d04eb3.js",
      revision: "23d96a36fa645d4509cd733258705f55"
  }, {
      url: "52d02ef3.js",
      revision: "e4cd7a10e3fd1175f81ef9b862aebeb9"
  }, {
      url: "5522257c.js",
      revision: "e637f1a8299f9f7cc5b25fb411990df3"
  }, {
      url: "5b4aa564.js",
      revision: "ba958658d1e6d8869c9e8dbddc5bef2c"
  }, {
      url: "79527e1a.js",
      revision: "f379cc11ad4e9303741b9c75d693b888"
  }, {
      url: "a45e43a2.js",
      revision: "99f5f6e54ce9653508a4e5f654db8bab"
  }, {
      url: "b38d1f5f.js",
      revision: "d8a38aaef3349d1670ee439ba99b3f34"
  }, {
      url: "bde9a434.js",
      revision: "0d79bc590ca7c8bc03f18ccc4e8edfd6"
  }, {
      url: "d939a4ec.js",
      revision: "ef5e6980feed0d63cbf606fcbae9ac0c"
  }, {
      url: "e9f41380.js",
      revision: "c3c259e448b0ffb0ab256cd25188159e"
  }, {
      url: "f36708e6.js",
      revision: "a4ee71fb4404ce043451a47fcab964e4"
  }, {
      url: "index.html",
      revision: "59735fdfcafe79f11e0dd60d44fc51af"
  }], {}), e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("/index.html"))), e.registerRoute("polyfills/*.js", new e.CacheFirst, "GET")
}));
//# sourceMappingURL=sw.js.map