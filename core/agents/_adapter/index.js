'use strict';

const { defineAgent, isAgent } = require('./agent_interface');
const { defineTool, isTool } = require('./tool_interface');
const { defineHandoff } = require('./handoff_interface');
const { createRunner, NotImplementedError } = require('./runner_interface');

function immutableEmptyMap() {
  const map = new Map();
  const throwImmutable = () => {
    throw new TypeError('Registry maps are frozen');
  };

  Object.defineProperties(map, {
    set: { value: throwImmutable, enumerable: false },
    delete: { value: throwImmutable, enumerable: false },
    clear: { value: throwImmutable, enumerable: false },
  });

  return Object.freeze(map);
}

/**
 * Return frozen empty registry constructors for future agent registration.
 * This helper creates no singleton registry and wires no runtime behavior.
 *
 * @returns {{agents: ReadonlyMap<string, unknown>, tools: ReadonlyMap<string, unknown>, handoffs: ReadonlyMap<string, unknown>}}
 */
function freezeRegistry() {
  return Object.freeze({
    agents: immutableEmptyMap(),
    tools: immutableEmptyMap(),
    handoffs: immutableEmptyMap(),
  });
}

module.exports = {
  defineAgent,
  isAgent,
  defineTool,
  isTool,
  defineHandoff,
  createRunner,
  freezeRegistry,
  NotImplementedError,
};
