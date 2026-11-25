"use client";

/** The AI session opened for the latest statement import, shared with the insights panel. */
let current: string | null = null;
export const getAiSession = () => current;
export const setAiSession = (id: string | null) => {
  current = id;
};
