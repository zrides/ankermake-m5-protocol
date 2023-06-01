from .prusaslicer import GCodeMetaPrusaSlicer

class GCodeMetaSuperSlicer(GCodeMetaPrusaSlicer):

    def detect_first_line(self, line):
        return b"generated by SuperSlicer" in line

    def load_props(self, fd):
        res = super().load_props(fd)
        if not res:
            return res

        if "superslicer_config" in res:
            res.pop("superslicer_config")

        return res