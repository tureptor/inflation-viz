from collections import defaultdict
import re
from typing import Iterator
import json

# TURN THIS INTO A CLASS INSTEAD

class Transformer:
    def __init__(self) -> None:
         # These two map long CPIH weight/index column names to short classification IDs
        self.weight_col_to_id: dict[str, str] = {} 
        # e.g. "CPIH WEIGHTS 09.4.1.1 Recre..." -> "09.4.1.1"
        self.index_col_to_id: dict[str, str]  = {}
        # e.g. "CPIH INDEX 06.2...." -> "06.2"

        # These three map short classification IDs to their respective outputs
        self.id_to_name: dict[str, str] = {}
        self.id_to_cpih_weight: dict[str, float] = {}
        self.id_to_cpih_time_series: dict[str, dict[str, float]] = defaultdict(dict)
        # "Recreational and sporting services - Attendance"
        # 1.4736
        # {"2015 JAN": 92.8, "2015 FEB": 92.8, ...}

        self.root = {}
        # Holds root of final JSON object


    def _init_dicts(self, column_names: list[str]) -> None:
        """
        TODO
        """
        for col in column_names:
            parts = col.split(" ", 3)
            if len(parts) < 4 or parts[0] != "CPIH":
                continue
            type_, id_, name = parts[1:]
            if type_ == "INDEX":
                self.index_col_to_id[col] = id_
            elif type_ == "WEIGHTS":
                self.weight_col_to_id[col] = id_
                self.id_to_name[id_] = name.title()

    def _process_row(self, row: dict) -> None:
        """
        TODO
        """
        row_date = row["Title"]

        if re.fullmatch(r"\d{4} [A-Z]{3}", row_date):
            for col_name, id_ in self.index_col_to_id.items():
                if row.get(col_name):
                    self.id_to_cpih_time_series[id_][row_date] = float(row[col_name])

        elif re.fullmatch(r"\d{4}", row_date):
            for col_name, id_ in self.weight_col_to_id.items():
                if row.get(col_name):
                    self.id_to_cpih_weight[id_] = float(row[col_name])


    def _populate_dicts(self, rows: Iterator[dict]) -> None:
        """
        TODO
        """
        # Extract column names, initialise dicts
        first_row = next(rows)
        column_names = list(first_row.keys())
        self._init_dicts(column_names)

        # process rows
        self._process_row(first_row)
        for row in rows:
            self._process_row(row)
        

    def _build_hierarchy(self):

        def _traverse_and_find_parent(target_part_ids: list[str], node):
            for c in node["children"]:
                child_part_ids = c["id"].split(".")
                if all(a in b.split("/") for a,b in zip(target_part_ids, child_part_ids)):
                    return _traverse_and_find_parent(target_part_ids, c)
            return node


        self.root = {
            "id": "00",
            "name": self.id_to_name["00"],
            "weight": self.id_to_cpih_weight["00"], 
            "values": self.id_to_cpih_time_series["00"],
            "children": []
        }
        del self.id_to_name["00"]

        for id_ in sorted(self.id_to_name.keys(), key=lambda key_: len(key_.split("."))):
            parent = _traverse_and_find_parent(id_.split("."), self.root)

            new_node = {
                "id": id_,
                "name": self.id_to_name[id_],
                "weight": self.id_to_cpih_weight[id_],
                "values": self.id_to_cpih_time_series[id_],
                "children": []
            }
            parent["children"].append(new_node)
 
    def run(self, rows: Iterator[dict]):
        self._populate_dicts(rows)
        self._build_hierarchy()
        #return json.dumps(self.root, separators=(',', ':'))
        return json.dumps(self.root, indent=2)
