import { ViewType } from '@/components/DataCrud/CrudWrapper';
import { map } from 'lodash';
import moment from 'moment';
import { parse } from 'querystring';
import React from 'react';
// encrypt customer  or other 
import crypto from 'crypto';

/* eslint no-useless-escape:0 import/prefer-default-export:0 */
const reg =
    /(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/;

const isDev = process.env.NODE_ENV === 'development';

export const server = `${window.location.hostname}:${isDev ? '8080' : window.location.port}`

// xport const servere = window.location.hostname.includes('10.0.12.247')
//     ? '10.0.12.247:85'
//     : window.location.hostname.includes('10.0.8.215')
//         ? '10.0.8.215:83'
//         : window.location.hostname.includes('ies.vital.com.kh')
//             ? 'ies.vital.com.kh'
//             : 'localhost:8080';

export const retailerEndPoint =
    window.location.hostname.includes('ies.vital.com.kh') ||
        window.location.hostname.includes('10.0.8.215') ||
        window.location.hostname.includes('10.0.8.209')
        ? 'https://retailer.ofl.a2hosted.com'
        : 'localhost:8080';

export const wsRetailerEndPoint =
    window.location.hostname.includes('ies.vital.com.kh') ||
        window.location.hostname.includes('10.0.8.215') ||
        window.location.hostname.includes('10.0.8.209')
        ? 'ies.vital.com.kh'
        : 'localhost:8080';

export const isUrl = (path: string): boolean => reg.test(path);

// export const isAntDesignPro = (): boolean => {
//     if (ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION === 'site') {
//         return true;
//     }
//     return window.location.hostname === 'workflow';
// };

//for the official demo site, used to close features that are not needed in the real development environment
// export const isAntDesignProOrDev = (): boolean => {
//     const { NODE_ENV } = process.env;
//     if (NODE_ENV === 'development') {
//         return true;
//     }
//     return isAntDesignPro();
// };

export const getPageQuery = () => parse(window.location.href.split('?')[1]);

export const moneyFormatter = (minimumFractionDigits?: number) =>
    new Intl.NumberFormat('en-US', {
        // style: 'currency',
        // currency: 'USD',
        minimumFractionDigits: minimumFractionDigits || 2,
    });

export const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
});

export const formatter1 = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
});


export const formatterQty = new Intl.NumberFormat('en-US', {
    compactDisplay: 'short',
});
export const formatterQty1 = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export const formatterPercentage0 = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
});

export const formatterKh = new Intl.NumberFormat('km-KH', {
    style: 'currency',
    currency: 'KHM',
    minimumFractionDigits: 2,
});

let option = {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
};

export const formatterPercentage = new Intl.NumberFormat('en-US');

export const formatConfig = {
    year: 'YYYY',
    date: 'YYYY-MM-DD',
    dateFull: 'DD-MMM-YYYY',
    dateTime: 'YYYY-MM-DD HH:mm:ss',
    month: 'YYYY-MM',
    monthFull: 'MMM-YYYY',
    duration: 'HH:mm:ss', // 'HH:mm:ss.SSS',
};


export const displayDateTime = (date?: moment.Moment): string | undefined => {
    if (date !== undefined) {
        const str = date.toString();
        const index = str.lastIndexOf('.');
        return str.substring(0, index).replace('T', ' ');
    }
    return '';
};

export const displayDate = (date?: moment.Moment): string | undefined => {
    if (date !== undefined) {
        const str = date.toString();
        const index = str.lastIndexOf('T');
        return str.substring(0, index);
    }
    return undefined;
};


export const formatYear = (date?: moment.Moment, format?: string): string | undefined => {
    return (
        date &&
        moment(date)
            // .utcOffset(0, true)
            .format(format ?? formatConfig.year)
    );
};
export const formatDate = (date?: moment.Moment, format?: string): string | undefined => {
    return (
        date &&
        moment(date)
            // .utcOffset(0)
            .format(format ?? formatConfig.date)
    );
};

export const formatDATEFUll = (date?: moment.Moment, format?: string): string | undefined => {
    return (
        date &&
        moment(date)
            // .utcOffset(0)
            .format(format ?? formatConfig.dateFull)
    );
};

export const formatDateTime = (date?: moment.Moment, format?: string): string | undefined => {
    return (
        date &&
        moment(date)
            // .utcOffset(0)
            .format(format ?? formatConfig.dateTime)
    );
};

export const formatMonth = (date?: moment.Moment, format?: string): string | undefined => {
    return (
        date &&
        moment(date)
            // .utcOffset(0, true)
            .format(format ?? formatConfig.month)
    );
};
export const formatMonthFull = (date?: moment.Moment, format?: string): string | undefined => {
    return (
        date &&
        moment(date)
            // .utcOffset(0, true)
            .format(format ?? formatConfig.monthFull)
    );
};

export const formatWithDuration = (start: moment.Moment, end: moment.Moment) => {
    const p = moment.duration(moment(end).diff(moment(start)));
    const day = p.days() > 0 ? `${p.days()}d` : undefined;
    const hour = p.hours() > 0 ? `${p.hours()}h` : undefined;
    const minute = p.minutes() > 0 ? `${p.minutes()}m` : undefined;
    const second = p.seconds() > 0 ? `${p.seconds()}s` : undefined;
    const millisecond = p.milliseconds() > 0 ? '1s' : undefined;
    return `${day ?? ''} ${hour ?? ''} ${minute ?? ''} ${second ?? millisecond ?? ''}`.trim();
};

export const checkPropExists = (obj: any, propName: string) => {
    return Object.keys(obj).some((it) => it === propName);
};

export const checkPropAny = (obj: any, propNames: string[]) => {
    return obj && Object.keys(obj).some((it) => propNames.some((it1) => it === it1));
};

export const durationFormat = (start: moment.Moment, end: moment.Moment) => {
    const duration = moment.duration(moment(end).diff(start));
    // return moment.utc(duration.asMilliseconds()).format(formatConfig.duration);
    return duration.humanize();
};

export const durationFormatEx = (start: moment.Moment, end: moment.Moment, format?: string) => {
    const duration = moment.duration(moment(end).diff(start));
    // return moment.utc(duration.asMilliseconds()).format(format ?? formatConfig.duration);
    return duration.humanize();
};

export const duration = (start: moment.Moment, end: moment.Moment) => {
    if (moment.isMoment(start) && moment.isMoment(end) && start.isBefore(end)) {
        // const diff = moment.preciseDiff(start.endOf('day'), end.startOf('day').endOf('month'));
        return 'diff';
    }
    return undefined;
};

export const durationEx = (start: moment.Moment, end: moment.Moment) => {
    if (moment.isMoment(start) && moment.isMoment(end)) {
        // console.log(' start and end are Moment')
        // const duration =   moment.preciseDiff(start, end)
        const duration = moment.duration(end.diff(start));
        return duration ? moment.duration(duration).asMilliseconds() : 0;
    }
    return 0;
};

export const formatDuration = (diff: number, format?: string) => {
    return moment.utc(diff).format(format ? format : formatConfig.duration);
};

export const formatDurationEx = (diff: number) => {
    const p = moment.duration(diff);
    const day = p.days() > 0 ? `${p.days()}d` : undefined;
    const hour = p.hours() > 0 ? `${p.hours()}h` : undefined;
    const minute = p.minutes() > 0 ? `${p.minutes()}m` : undefined;
    const second = p.seconds() > 0 ? `${p.seconds()}s` : undefined;
    const millisecond = p.milliseconds() > 0 ? '1s' : undefined;

    return `${day ?? ''} ${hour ?? ''} ${minute ?? ''} ${second ?? millisecond ?? ''}`.trim();
};

export const currentDate = () => {
    return moment().utcOffset(0, true);
};

export const wrapLocalDate = (date: moment.Moment) => {
    return moment(date).utcOffset(0, true);
};

export const getWeekendDay = (current: moment.Moment) => {
    const date = moment(current).utcOffset(0, true);
    // if (date.weekday() == 6 || date.weekday() == 7) {
    //   return 24 * 3600 * 1000;
    // }
    return 0;
};

export const getWeekendDays = (dates: moment.Moment[]) => {
    let count = 0;
    dates.map((d) => (count = count + getWeekendDay(moment(d))));
    return count;
};

export const translateToKh = (date: moment.Moment) => {
    return `ថ្ងៃទី ${date.get('D')} ខែ ${monthMap.get(date.get('M'))} ឆ្នាំ ${date.get('years')}`;
};

export const isOffline = () => window.location.href.includes('offline');

export const offlineToken = () => localStorage.getItem('offlineToken');
export const setOfflineToken = (token: string) => {
    localStorage.setItem('offlineToken', token);
    localStorage.removeItem('accessToken');
};
export const removeOfflineToken = () => localStorage.removeItem('offlineToken');

const monthMap = new Map([
    [0, 'មករា'],
    [1, 'កុម្ភៈ'],
    [2, 'មីនា'],
    [3, 'មេសា'],
    [4, 'ឧសភា'],
    [5, 'មិថុនា'],
    [6, 'កក្កដា'],
    [7, 'សីហា'],
    [8, 'កញ្ញា'],
    [9, 'តុលា'],
    [10, 'វិច្ឆិកា'],
    [11, 'ធ្នូ'],
]);

const readableWords = [
    { PENDING: 'Pending' },
    { LOADING: 'Loading' },
    { LOADED: 'Loaded' },
    { COMPLETED: 'Completed' },
    { CONFIRMED: 'Confirmed' },
    { HOLD: 'Hold' },
    { CANCELED: 'Canceled' },
    { DELIVERED: 'Delivered' },
    { IN_PROGRESS: 'In Progress' },
    { DELIVERY: 'Delivery' },
    { PICKING: 'Picking' },
    { QUEUE: 'Queue' },
    { SETTLEMENT: 'Settlement' },
    { REJECTED: 'Rejected' },
    { EXPIRED: 'Expired' },
    { NEW: 'New' },
    { TICKET_ISSUED: 'Ticket Issued' },
    { TICKET_PRIORITY: 'Ticket Priority' },
    { LOADING_DOCK_ALLOCATED: 'Loading Dock Allocted' },
    { PICKING_SLIP_ASSIGNED: 'Picking Slip Assigned' },
    { PICKING_SLIP_CANCELED: 'Picking Slip Canaceled' },
    { LOADING_STARTED: 'Loading Started' },
    { LOADING_CANCELED: 'Loading Canceled' },
    { LOADING_ON_HOLD: 'Loading On Hold' },
    { LOADING_RECALL: 'Loading Recall' },
    { LOADING_ENDED: 'Loading Ended' },
    { DOC_ASSIGNED: 'Doc Assigned' },
    { CANCEL_DELIVERY: 'Cancel Delivery' },
    { RESOLVE_DELIVERY: 'Resolve Deilivery' },
    { CHANGE_TRUCK: 'Change Truck' },
    { CHECK_IN: 'Check In' },
    { CHECK_OUT: 'Check Out' },
    { TRIP_STARTED: 'Trip Started' },
    { TRIP_ENDED: 'Trip Ended' },
    { SETTLED: 'Settled' },
    { SETTLE_CONFIRMED: 'Settle Confirmed' },
    { TICKET_CANCELED: 'Tricket Canceled' },
    { CLOSED: 'Closed' },
    { ON_HOLD: 'On Hold' },
    { APPROVED: 'Approved' },
    { POSTED: 'Posted' },
    { FAILED: 'Failed' },
    { DRAFT: 'Draft' },
    { DRAFTED: 'Drafted' },
    { DONE: 'Done' },
    { ACTIVE: 'Active' },
    { IN_ACTIVE: 'Inactive' },
    { INACTIVE: 'Inactive' },
    { PREPARED: 'Prepared' },
    { SUBMITTED: 'Submitted' },
    { SUBMITTING: 'Submitting' },
    { REWORKED: 'Reworked' },
    { PROCESSED_CYCLE: 'Processed cycle' },
    { ACHIEVED: 'Achieved' },
    { ISSUED: 'Issued' },
    { IGNORED: 'Ignored' },
    { IMPORTED: 'Imported' },
    { NEW: 'New' },
    { UPDATE_STATUS: 'Updated(Status)' },
    { UNCHANGED: 'Unchanged' },
    { TERMINATED: 'Terminated' },
    { SELECTED: 'Selected' },
    { REQUESTED: 'Requested' },
    { CREATED: 'Created' },
    { ADD_ADJUSTMENT: 'Add Adjustment' },
    { ADDED: 'Added' },
    { REMOVED: 'Removed' },
    { NEW_REQUEST: 'New Request' },
    { UPDATED: 'Updated' },
    { REVIEWING: 'Reviewing' },
    { SETTING: 'Setting' },
    { NONE: 'NA' },
];
export const toReadable = (word?: string) => {
    if (!word) return '';
    const rs = map(readableWords, word).filter((it) => it && it !== '');
    if (!rs || rs.length === 0) return word;
    return rs.join(' ');
};

export const getColorStatus = (status?: string) => {
    if (['ACTIVE'].some((it) => it === status)) {
        return 'success';
    }

    if (['EXPIRED'].some((it) => it === status)) {
        return 'warning';
    }

    if (['FAILED'].some((it) => it === status)) {
        return 'error';
    }

    if (['INACTIVE'].some((it) => it === status)) {
        return 'gray';
    }

    if (['PENDING', 'PROCESSED_CYCLE'].some((it) => it === status)) {
        return 'processing';
    }
};

export const blobToBase64 = function (blob: Blob, callback: (base64: string) => void) {
    const reader = new FileReader();
    reader.onload = function () {
        const dataUrl = reader.result as any;
        const base64 = dataUrl.split(',')[1];
        callback(base64);
    };
    reader.readAsDataURL(blob);
};

export function isReactNode(value: any): value is React.ReactNode {
    if (value === null || value === undefined || typeof value === 'boolean') {
        return true;
    }

    if (typeof value === 'string' || typeof value === 'number') {
        return true;
    }

    if (Array.isArray(value)) {
        return value.every(isReactNode);
    }

    if (React.isValidElement(value)) {
        return true;
    }

    return false;
}


const key = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8'); // 32 bytes
const iv = Buffer.from('abcdef9876543210', 'utf8');                  // 16 bytes

export function encryptToBase64(text: string): string {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const base64 = encrypted.toString('base64');
    // Convert to URL-safe base64
    const urlSafeBase64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return urlSafeBase64;
}