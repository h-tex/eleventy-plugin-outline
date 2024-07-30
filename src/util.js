export function slugify (text) {
	return (text + "")
			.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Convert accented letters to ASCII
			.replace(/&\w+;/g, "") // Remove HTML entities
			.replace(/[^\w\s-]/g, "") // Remove remaining non-ASCII characters
			.trim().replace(/\s+/g, "-") // Convert whitespace to hyphens
			.toLowerCase();
}

export function capitalize (text) {
	return text[0].toUpperCase() + text.slice(1);
}

import { URL } from 'url';
import path from "path";

export function rebase_url (url, from_base, to_base) {
	// Use a dummy base URL to ensure the bases are absolute
	let dummyBase = 'https://dummy/';

	// Resolve old_base and new_base to absolute URLs
	let absoluteOldBase = new URL(from_base, dummyBase);
	let absoluteNewBase = new URL(to_base, dummyBase);

	// Convert the url relative to the old base to an absolute URL
	let absoluteUrl = new URL(url, absoluteOldBase);

	// Determine the relative path from the new base
	let relativeUrl = path.relative(absoluteNewBase.pathname, absoluteUrl.pathname);
	let local = absoluteUrl.search + absoluteUrl.hash;

	if (local && !relativeUrl.endsWith("/")) {
		relativeUrl = relativeUrl + "/";
	}

	return relativeUrl + local;
}

export function get_path (url) {
	return new URL(url, 'https://dummy/').pathname;
}

export function same_path (path1, path2) {
	return get_path(path1) === get_path(path2);
}

export function get_hash (url) {
	return new URL(url, 'https://dummy/').hash;
}