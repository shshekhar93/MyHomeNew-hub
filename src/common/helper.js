'use strict';

export const getViewPortWidth = () => {
    const d = document;
    const documentElement = d.documentElement;
    const body = d.getElementsByTagName('body')[0];
    return (window.innerWidth || documentElement.clientWidth || body.clientWidth);
};

export const noop = () => {};
