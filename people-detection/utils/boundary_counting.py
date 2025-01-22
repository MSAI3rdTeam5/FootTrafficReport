class BoundaryCounting:
    def __init__(self, boundary):
        self.boundary = boundary
        self.counts = {'in': 0}
        self.crossed_ids = set()

    def count_objects(self, tracked_objects):
        count = 0
        for obj in tracked_objects:
            if self.is_inside(obj):
                count += 1
        return {'in': count}

    def is_inside(self, obj):
        x1, y1, x2, y2 = self.boundary
        obj_x, obj_y = obj.center  # Assuming obj has a center attribute with (x, y) coordinates
        return x1 <= obj_x <= x2 and y1 <= obj_y <= y2