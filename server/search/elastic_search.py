import json
import os
import pathlib
from pprint import pprint

from dotenv import load_dotenv

from elasticsearch import Elasticsearch, helpers

load_dotenv()


class Search:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(Search, cls).__new__(cls)
            cls._instance._init_es()
        return cls._instance

    def _init_es(self):
        cert_file_path = os.path.join(
            pathlib.Path(__file__).parent.parent.parent, "ca.crt"
        )
        self.es = Elasticsearch(
            [{"host": "localhost", "port": 9200, "scheme": "https"}],
            basic_auth=("elastic", os.getenv("ELASTIC_PASSWORD")),
            ca_certs=cert_file_path,
        )
        self.es.options(ignore_status=400)
        self.index = "bilara-data"
        self._create_index(self.index)
        self._populate_index(self.index)

    def _get_es_settings(self):
        return {
            "analysis": {
                "analyzer": {
                    "lowercase_analyzer": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": ["lowercase"],
                    },
                    "shingle_analyzer": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": ["lowercase", "shingle"],
                    },
                }
            }
        }

    def _get_es_mappings(self):
        return {
            "properties": {
                "uid": {"type": "keyword"},
                "language": {"type": "keyword"},
                "author": {"type": "keyword"},
                "type": {"type": "keyword"},
                "muid": {"type": "keyword"},
                "segment": {
                    "type": "text",
                    "analyzer": "lowercase_analyzer",
                    "search_analyzer": "lowercase_analyzer",
                },
            }
        }

    def _create_index(self, index):
        if self.es.indices.exists(index=index):
            return
        self.es.indices.create(
            index=index,
            settings=self._get_es_settings(),
            mappings=self._get_es_mappings(),
        )

    def _populate_index(self, index):
        if self._is_index_empty(index):
            for data in self._get_data():
                actions = [
                    {
                        "_index": index,
                        "_source": document,
                    }
                    for document in data
                ]
                helpers.bulk(self.es, actions)

    def _is_index_empty(self, index):
        return self.es.count(index=index)["count"] == 0

    def _get_work_dir(self):
        return (
            pathlib.Path(__file__).absolute().parent.parent.parent
            / "checkouts"
            / "unpublished"
        )

    def _get_json_data(self, file):
        with open(file, "r") as f:
            return json.load(f)

    def _traverse_dir(self, directory):
        top_level = True
        for root, dirs, files in os.walk(directory):
            dirs[:] = [d for d in dirs if not d.startswith(".")]
            if top_level:
                top_level = False
                continue
            for file in files:
                if file.endswith(".json"):
                    yield os.path.join(root, file)

    def _get_data(self):
        dir_path = self._get_work_dir()
        for json_file in self._traverse_dir(dir_path):
            data = self._get_json_data(json_file)
            if data:
                yield self._prepare_data(data, self._muid_from_file_path(json_file))

    def _prepare_data(self, data, muid):
        documents = []
        _type, language, author = muid.split("-", 2)
        for key, value in data.items():
            document = {
                "uid": key,
                "language": language,
                "author": author,
                "type": _type,
                "muid": muid,
                "segment": value,
            }
            documents.append(document)
        return documents

    def _muid_from_file_path(self, json_file):
        file_path = pathlib.Path(json_file)
        post_unpublished = file_path.parts[file_path.parts.index("unpublished") + 1 :]
        return "-".join(post_unpublished[:3])


    def _uid(self, uid, muids, size, from_):
        results = {}
        for muid in muids:
            es_result = self._search_by_uid(uid, muid, size, from_)
            for result in es_result:
                current_uid = result["_source"]["uid"]
                if current_uid not in results:
                    results[current_uid] = {muid: "" for muid in muids}
                results[current_uid][muid] = result["_source"]["segment"]
        return results

    def _lookup(self, query, muids, size, from_):
        results = {}
        for muid in muids:
            lookup = query[muid]
            results[muid] = {}
            es_result = self._search_by_lookup(muid, lookup, size, from_)
            if es_result:
                for result in es_result:
                    results[muid][result["_source"]["uid"]] = result["_source"][
                        "segment"
                    ]

        empty_muids = [key for key, value in results.items() if isinstance(value, dict) and not value]
        non_empty_muids = [key for key, value in results.items() if isinstance(value, dict) and value]

        if non_empty_muids:
            if len(non_empty_muids) == 1:
                non_empty_muid = non_empty_muids[0]
                for empty_muid in empty_muids:
                    results[empty_muid] = {uid: "" for uid in results[non_empty_muid].keys()}
                    for uid, _ in results[empty_muid].items():
                        res = self._search_by_uid(uid=uid, size=1, muid=empty_muid)
                        if res:
                            results[empty_muid][uid] = res[0]["_source"]["segment"]
            else:
                common_uids = set(results[non_empty_muids[0]].keys())
                for non_empty_muid in non_empty_muids[1:]:
                    common_uids.intersection_update(results[non_empty_muid].keys())
                for empty_muid in empty_muids:
                    results[empty_muid] = {uid: "" for uid in common_uids}
                    for uid, _ in results[empty_muid].items():
                        res = self._search_by_uid(uid=uid, size=1, muid=empty_muid)
                        if res:
                            results[empty_muid][uid] = res[0]["_source"]["segment"]

        transposed_results = {
            inner_key: {
                outer_key: inner_dict[inner_key]
                for outer_key, inner_dict in results.items()
                if inner_key in inner_dict
            }
            for outer_dict in results.values()
            for inner_key in outer_dict
        }

        filtered_results = {
            key: value
            for key, value in transposed_results.items()
            if all(
                muid in value
                for muid in muids
            )
        }
        return filtered_results

    def search(self, query, size=50, from_=0):
        uid = query.pop("uid", None)
        muids = [muid for muid in query.keys()]
        if uid and not any(query.values()):
            results = self._uid(uid, muids, size, from_)
            return dict(list(results.items())[from_ : from_ + size])
        if uid and any(query.values()):
            uid_results = self._uid(uid, muids, size, from_)
            lookup_results = self._lookup(query, muids, size, from_)
            common = [uid for uid in uid_results.keys() if uid in lookup_results]
            results = {uid: {**uid_results[uid], **lookup_results[uid]} for uid in common}
            return dict(list(results.items())[from_ : from_ + size])
        results = self._lookup(query, muids, size, from_)
        return dict(list(results.items())[from_ : from_ + size])


    def _search_by_uid(self, uid, muid=None, size=50, from_=0):
        if muid:
            query = {
                "bool": {"must": [{"term": {"muid": muid}}, {"prefix": {"uid": uid}}]}
            }
        else:
            query = {"prefix": {"uid": uid}}
        results = self.es.search(
            index=self.index, query=query, size=10000, from_=from_
        )
        return results["hits"]["hits"]

    def _search_by_lookup(self, muid, lookup, size=50, from_=0):
        query = {"bool": {"must": [{"match_phrase": {"segment": lookup}}]}}
        if muid:
            query["bool"]["must"].append({"term": {"muid": muid}})
        results = self.es.search(
            index=self.index,
            query=query,
            size=10000,
            from_=from_,
        )

        return results["hits"]["hits"]

