import json
import re
from collections import defaultdict
from typing import Iterator


class Transformer:
    """Given the cleaned CSV rows as input, transform it into a hierarchical JSON.

    Attributes:
        _weight_col_to_id (dict[str, str]): map a CPIH weight column name ("CPIH WEIGHTS 09.4.1.1 Recre...")
            to a classification ID ("09.4.1.1")
        _index_col_to_id (dict[str, str]): map a CPIH index column name ("CPIH INDEX 06.2....")
            to a classification ID ("06.2")
        _id_to_name (dict[str, str]):  map a classification ID ("01.1.1")
            to its name ("Bread & Cereals")
        _id_to_cpih_weight (dict[str, float]): map a classification ID ("01.2.1")
            to its latest CPIH weight (2.1407)
        _id_to_cpih_time_series (dict[str, dict[str, float]]): map a classification ID ("04.2")
            to a dictionary of ("YYYY MMM" -> corresponding CPIH indices)
            e.g. {"1988 JAN": 51.3, "1988 FEB": 51.4, "1988 MAR": 51.4, ... }
    """

    def __init__(self, rows: Iterator[dict[str, str]]):
        """Takes in CSV rows, then populates internal dicts
        using column names and row values.

        User must then call .to_json() to generate and return the
        hierarchical JSON using these dictionaries.

        Args:
            rows: dictionaries of col_names -> values
        """
        self._weight_col_to_id: dict[str, str] = {}
        self._index_col_to_id: dict[str, str] = {}
        self._id_to_name: dict[str, str] = {}
        self._id_to_cpih_weight: dict[str, float] = {}
        # _id_to_cpih_time_series is a defaultdict(dict) to facilitate easy access
        # with nested keys e.g. _id_to_cpih_time_series["03.4"]["2025 MAY"] = 143.4
        self._id_to_cpih_time_series: dict[str, dict[str, float]] = defaultdict(dict)

        # finally use the inputted rows to populate these dictionaries
        self._populate_dicts(rows)

    def _fill_name_dicts(self, column_names: list[str]) -> None:
        """Uses provided column names and populates the "col_name -> id", "id -> name" dicts.

        Args:
            column_names: list of all column names
        """
        for col in column_names:
            parts = col.split(" ", 3)
            if len(parts) < 4 or parts[0] != "CPIH":
                continue  # skip irrevelant (not CPIH weight or index) columns
            type_, id_, name = parts[1:]
            if type_ == "INDEX":
                self._index_col_to_id[col] = id_
            elif type_ == "WEIGHTS":
                self._weight_col_to_id[col] = id_
                self._id_to_name[id_] = name.title()
                # ^ could move this in the above "if" block too.

    def _process_row(self, row: dict[str, str]) -> None:
        """Process row information and add entries to _id_to_cpih* dicts

        Args:
            row: dictionary of col_names -> row values
        """
        row_date = row["Title"]

        # We want the CPIH indices from the "YYYY MMM" rows
        if re.fullmatch(r"\d{4} [A-Z]{3}", row_date):
            for col_name, id_ in self._index_col_to_id.items():
                if row.get(col_name):  # CPIH index is not defined for ALL YYYY MMM rows
                    self._id_to_cpih_time_series[id_][row_date] = float(row[col_name])

        # The YYYY rows have the CPIH weights. The newest entries are processed last, so
        # the resultant entry in _id_to_cpih_weight will have the latest CPIH weight
        # for that ID.
        elif re.fullmatch(r"\d{4}", row_date):
            for col_name, id_ in self._weight_col_to_id.items():
                if row.get(col_name):
                    self._id_to_cpih_weight[id_] = float(row[col_name])

    def _populate_dicts(self, rows: Iterator[dict[str, str]]) -> None:
        """Populate internal dicts using inputted CSV rows.

        Args:
            rows: dictionaries of col_names -> row values
        """
        # Extract column names and initialise name dicts
        first_row = next(rows)
        column_names = list(first_row.keys())
        self._fill_name_dicts(column_names)

        # process rows and fill in the data dicts
        self._process_row(first_row)
        for row in rows:
            self._process_row(row)

    def _is_ancestor(self, target: list[str], candidate: str) -> bool:
        """Helper function which determines if candidate is an ancestor of target.

        Assumes that target is not an ancestor of candidate.

        Args:
            target: e.g., ["09", "2", "1", "3"] from "09.2.1.3"
            candidate str: ID of candidate, e.g. "012.1.2"

        Returns:
            A boolean - is candidate ancestor of target?
        """
        # special case - "00" node is root of all other nodes.
        if candidate == "00":
            return True
        # .split("/") is necessary since e.g. "9.2.1.3" is a descendant of "9.2/3"
        return all(t in c.split("/") for t, c in zip(target, candidate.split(".")))

    def _traverse_and_find_parent(self, target_part_ids: list[str], node: dict) -> dict:
        """Helper DFS function - finds the parent node for target id within the tree "node".

        DFS is fine since max depth is very small (4)

        Args:
            target_part_ids: e.g., ["09", "2", "1", "3"] from "09.2.1.3"
            node: root of (sub)tree to traverse.

        Returns:
            Node of input tree which is the parent of the target.
        """
        for c in node["children"]:
            if self._is_ancestor(target_part_ids, c["id"]):
                return self._traverse_and_find_parent(target_part_ids, c)
        # if none of the children were ancestors, current node must be the parent.
        return node

    def to_json(self) -> str:
        """Build hierarchical JSON containing CPIH info and return it.

        Assumes the internal dicts for the class instance are populated.

        Returns:
            String representation of JSON dump of the hierarchical dictionary of CPIH info.
        """
        dummy_root = {"children": []}

        # we sort to ensure BFS traversal. This is necessary for the
        # assumption _is_ancestor (called by _traverse_and_find_parent) makes.
        for id_ in sorted(
            self._id_to_name.keys(), key=lambda key_: len(key_.split("."))
        ):
            parent = self._traverse_and_find_parent(id_.split("."), dummy_root)

            new_node = {
                "id": id_,
                "name": self._id_to_name[id_],
                "weight": self._id_to_cpih_weight[id_],
                "indices": self._id_to_cpih_time_series[id_],
                "children": [],
            }
            parent["children"].append(new_node)

        # replace dummy root node with real root node (id: "00")
        root = dummy_root["children"][0]

        return json.dumps(root, indent=2)
