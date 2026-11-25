# 1. Expo, Skia and a hand-written solver

Status: accepted, 2026-11-24

## Decision

Expo + React Native, React Native Skia for drawing, Reanimated worklets for the loop, Gesture Handler for touch. Physics is our own code (`src/core/world.ts`).

## Why

Spheres in an axis-aligned box need only plane and sphere contacts. An engine would add weight and take away direct control of feel. A bubble is a disc on screen, so a 2D shader with a computed normal looks three-dimensional without meshes, lights or a 3D renderer. Touch, physics and drawing share one thread, so there is no bridge delay.

## Alternatives

| Option                     | Why not                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| React Three Fiber + Rapier | Two heavy layers for one shape; slower start                       |
| WebGPU / raw GL            | More power than needed and much more code                          |
| Web app (canvas / WebGL)   | Lightest to ship, but weak haptics on iOS and edge-swipe conflicts |
| Native Swift + Metal       | Best possible, but iOS only and unfamiliar                         |
| Unity / Godot              | Large binary and runtime                                           |

## Revisit if

We need real refraction between bubbles, non-box rooms, or more than about 30 bubbles.
